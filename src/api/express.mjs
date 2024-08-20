import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import passport from 'passport';
import logger from 'morgan';
import path from 'path';
import expressWebsocket from "express-ws";
import authRoutes from './routes/authRoutes.mjs';
import projectRoutes from './routes/projectRoutes.mjs';
import mergeRequestRoutes from './routes/mergeRequestRoutes.mjs';
import mergeReviewsRoutes from './routes/mergeReviewsRoutes.mjs';
import issueRoutes from './routes/issueRoutes.mjs';
import { config } from 'dotenv';
import {verifyToken} from "./middleware/verifyGitlabWebhookToken.mjs";
import {isLoggedIn} from "./middleware/isLoggedIn.mjs";
import {GitlabURLs} from "../resources/gitlabURLs.mjs";
import {createWebhook, createWebhookNotes} from "../service/webhookService.mjs";
import {elapsedTime} from "../service/utils/dateFormat.mjs";
import {gitlabEventTypes} from "../resources/gitlabEventTypes.mjs";
import {loggedUserId,loggedUserDisplayName} from '../service/oauthService.mjs';

config();
const __filename = `${import.meta.url.slice(7)}`
const __dirname = path.dirname(__filename)
const __root = path.resolve(__dirname, '../../')
const { PORT } = process.env;
const app = express();
expressWebsocket(app);

const { MONGO_URI } = process.env;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
    });

const publicPath = path.join(__root, 'public')
app.use(express.static(publicPath))
const viewsPath = path.join(__root, 'views')
app.set('views', viewsPath)
app.set('view engine', 'ejs')

app.use(logger('combined'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions', 
    }),
    cookie: {
        secure: false, 
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24,
        Partitioned: true,
    },
}));

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "public/js",
                "https://unpkg.com/htmx.org@1.9.12",
                "https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.js",
                "https://unpkg.com/idiomorph@0.3.0",
                "https://unpkg.com/idiomorph/dist/idiomorph-ext.min.js",
                "https://cdn.jsdelivr.net/codemirror.spell-checker/latest/en_US.dic",
                "https://unpkg.com/htmx.org@1.9.12/dist/ext/ws.js"
            ],
            imgSrc: ["'self'", "public/img",'https://gitlab.lnu.se', 'https://gitlab.com', 'https://secure.gravatar.com'],
            connectSrc: ["'self'", 'https://gitlab.lnu.se', 'https://gitlab.com', 'https://cdn.jsdelivr.net/codemirror.spell-checker/latest/en_US.aff',
            'https://cdn.jsdelivr.net/codemirror.spell-checker/latest/en_US.dic', 'https://unpkg.com/htmx.org@1.9.12/dist/ext/ws.js', 'ws://localhost:8000']
        }
    })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(cors());
app.use(compression({
    brotli: true,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

//ROUTES
//=====================================

app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use("/issues", issueRoutes);
app.use("/merge_requests", mergeRequestRoutes);
app.use("/merge_reviews", mergeReviewsRoutes);

app.get("/", (req, res) => {
    res.render('pages/AuthPage.ejs')
});

app.get("/failure", (req, res) => {
    res.send("Something went wrong. Please try again");
});

app.get("/logout", (req, res) => {
    req.logout();
    req.session.destroy();
    res.send("You are now logged out!");
});

const updatesClients = new Set();
const mergeRequestClients = new Map();
const issueClients = new Map();

app.ws('/updates', (ws) => {
    console.log('WebSocket connection established');

    updatesClients.add(ws);

    ws.on('message', (message) => {
        console.log('Received message:', message);
    });

    ws.on('close', () => {
        updatesClients.delete(ws);
        console.log('WebSocket connection closed');
    });
});
app.ws('/issues/:id', (ws, req) => {
    const { id } = req.params;

    console.log(`WebSocket connection established for issue notes: Issue ID = ${id}`);

    
    if (!issueClients.has(id)) {
        issueClients.set(id, []);
    }

    const clients = issueClients.get(id);
    clients.push(ws);


    ws.on('close', () => {
        console.log(`WebSocket connection closed for issue notes: Issue ID = ${id}`);
        const clients = issueClients.get(id) || [];
        const updatedClients = clients.filter(client => client !== ws);
        issueClients.set(id, updatedClients);

        if (updatedClients.length === 0) {
            issueClients.delete(id);
        }
    });

    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});
app.ws('/merge_requests/:id', (ws, req) => {
    const { id } = req.params;

    console.log('WebSocket connection established for merge request notes');

    if (!mergeRequestClients.has(id)) {
        mergeRequestClients.set(id, []);
    }

    const clients = mergeRequestClients.get(id);
    clients.push(ws);

    ws.on('close', () => {
        console.log(`WebSocket connection closed for issue notes: Issue ID = ${id}`);
        const clients = mergeRequestClients.get(id) || [];
        const updatedClients = clients.filter(client => client !== ws);
        mergeRequestClients.set(id, updatedClients);

        if (updatedClients.length === 0) {
            mergeRequestClients.delete(id);
        }
    });
});

app.get('/webhooks/gitlab/:project_id/create', isLoggedIn, async (req, res, next) => {
    try {
        const accessToken = req.user.gitlabAccessToken;
        const projectId = req.params.project_id;

        const URL = req.user.baseURL + GitlabURLs.WEBHOOKS(projectId);

        await createWebhook(accessToken, URL);
        await createWebhookNotes(accessToken, URL);

        res.status(201);
    } catch (error) {
        next(error);
    }
});

app.post('/webhooks/gitlab', verifyToken, async (req, res, next) => {
    try {

        let message = '';
        const eventType = req.headers['x-gitlab-event'];  // Determine the event type from the headers

        switch (eventType) {
            case gitlabEventTypes.PUSH_HOOK:
                message = `<p>
            <img src="${req.body.user_avatar}" alt="Avatar">
            <strong>${req.body.user_name}</strong> pushed to <strong>${req.body.project.name}</strong>
            </p> <small><time class="timestamp">${elapsedTime(req.body.commits[0].timestamp)}</time></small>`;
                break;

            case gitlabEventTypes.MERGE_REQUEST_HOOK:
                message = `<p>
            <img src="${req.body.user.avatar_url}" alt="Avatar">
            <strong>${req.body.user.name}</strong> ${req.body.object_attributes.action} merge request 
            <strong>${req.body.object_attributes.title}</strong> in <strong>${req.body.project.name}</strong>
            <small><time class="timestamp">${elapsedTime(req.body.object_attributes.created_at)}</time></small></p>`;
                break;

            case gitlabEventTypes.ISSUE_HOOK:
                message = `<p>
            <img src="${req.body.user.avatar_url}" alt="Avatar">
            <strong>${req.body.user.name}</strong> ${req.body.object_attributes.action} issue 
            <strong>${req.body.object_attributes.title}</strong> in <strong>${req.body.project.name}</strong>
            <small><time class="timestamp">${elapsedTime(req.body.object_attributes.updated_at)}</time></small></p>`;
                break;
            default:
                message = '';
        }

        updatesClients.forEach(ws => {
            if (ws.readyState === ws.OPEN) {
                ws.send(`
                    <div id="updates" data-update-type=${eventType} hx-swap-oob="afterbegin">
                        <div class="update">${message}</div>
                    </div>
                `);
            }
        });

        res.status(200).send('Webhook received');
    } catch (error) {
        next(error);
    }
});

app.post('/webhooks/gitlab/notes',verifyToken, (req, res) => {
    const data = req.body;
    const { project, object_attributes, user } = data;
    const project_id = project.id;
    const object_id = object_attributes.id;

        let combined_id;
        let noteHtml = '';
        let clients = [];

        if (object_attributes.noteable_type === 'MergeRequest') {
            const mergeRequestId = data.merge_request.iid;
            combined_id = `${project_id}${mergeRequestId}`;

            clients = mergeRequestClients.get(combined_id) || [];

            const note = {
                id: object_attributes.id,
                system: object_attributes.system,
                username: user.username,
                name: user.name,
                createdAt: elapsedTime(object_attributes.created_at),
                body: object_attributes.note,
                avatar: user.avatar_url,
                mergeId: mergeRequestId,
                projectId: project_id
            };

            noteHtml = createNoteHtml(note, 'merge');

        } else if (object_attributes.noteable_type === 'Issue') {
            const issueId = data.issue.iid;
            combined_id = `${project_id}${issueId}`;
            clients = issueClients.get(combined_id) || [];

            const note = {
                id: object_attributes.id,
                system: object_attributes.system,
                username: user.username,
                name: user.name,
                createdAt: elapsedTime(object_attributes.created_at),
                body: object_attributes.note,
                avatar: user.avatar_url,
                issueId: issueId,
                projectId: project_id
            };

            noteHtml = createNoteHtml(note, 'issue');
        }

        clients.forEach(ws => {
            if (ws.readyState === ws.OPEN) {
                ws.send(
                    `<div id="note-thread" hx-swap-oob="beforeend">${noteHtml}</div>`
                );
            }
        });


    res.status(200).send('Webhook received');
});

function createNoteHtml(note, type) {
    if (note.system) {
        return `
        <li>
            <div class="system-note" id="${note.id}">
                <div class="name">${note.name}</div>
                <p>${note.body}
                    <time class="timestamp" datetime="${note.createdAt}">${note.createdAt}</time>
                </p>
            </div>
        </li>`;
    } else {
        return `
        <div class="comment-container" id="comment-${note.id}">
            <img class="user-avatar" src="${note.avatar}" alt="&#25CF">
            <li class="no-dot">
                <div class="note" id="${note.id}">
                    <div class="note-header">
                        <div class="name">${note.name}</div>
                        <div class="username">${note.username}</div>
                        <time class="timestamp" datetime="${note.createdAt}">${note.createdAt}</time>
                        ${note.name === loggedUserDisplayName ? `
                        <div class="delete-btn"
                             hx-delete="${type === 'issue' ? `${note.issueId}/notes/${note.id}` : `${note.mergeId}/notes/${note.id}`}"
                             hx-target="#comment-${note.id}"
                             hx-swap="outerHTML"
                             hx-confirm="Are you sure you want to delete this comment?">
                            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#000000">
                                <path d="M312-144q-29.7 0-50.85-21.15Q240-186.3 240-216v-480h-48v-72h192v-48h192v48h192v72h-48v479.57Q720-186 698.85-165T648-144H312Zm336-552H312v480h336v-480ZM384-288h72v-336h-72v336Zm120 0h72v-336h-72v336ZM312-696v480-480Z"/>
                            </svg>
                        </div>` : ''}
                    </div>
                    <div class="note-body">
                        <p>${note.body}</p>
                    </div>
                </div>
            </li>
        </div>`;
    }
}

export default (port = PORT) => {
    app.listen(port, () => { console.log(`Listening at port ${port}`) })
};
