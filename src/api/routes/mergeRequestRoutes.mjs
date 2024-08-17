import express from "express";
import {
    getMergeRequests,
    getMergeRequest,
    createMergeRequestNote,
    deleteMergeRequestNote
} from "../../service/mergeRequestsService.mjs";
import {isLoggedIn} from "../middleware/isLoggedIn.mjs";
import {GitlabURLs} from "../../resources/gitlabURLs.mjs";
import {contentTitles} from "../../resources/contentTitles.mjs";
import {activeItem} from "../../resources/activeItem.mjs";
import {states} from "../../resources/states.mjs";
import {renders} from "../../resources/renders.mjs";
import {sanitizeBody} from "../middleware/sanitizeBody.mjs";
import {createIssueNote, deleteIssueNote} from "../../service/issuesService.mjs";

const router = express.Router();

router.get("/gitlab/all", isLoggedIn, async (req, res, next) => {
    try {
        const accessToken = req.user.gitlabAccessToken;
        let URL;
        const state = req.query.state;

        switch (state) {
            case states.OPENED:
                if (req.query.search) {
                    const searchParam = req.query.search;
                    URL = req.user.baseURL + GitlabURLs.MERGE_REQUEST_SEARCH_OPENED(searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.MERGE_REQUEST_PAGE_OPENED(page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.MERGE_REQUESTS_OPENED;
                }
                break;
            case states.CLOSED:
                if (req.query.search) {
                    const searchParam = req.query.search;
                    URL = req.user.baseURL + GitlabURLs.MERGE_REQUEST_SEARCH_CLOSED(searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.MERGE_REQUEST_PAGE_CLOSED(page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.MERGE_REQUESTS_CLOSED;
                }
                break;
            case states.MERGED:
                if (req.query.search) {
                    const searchParam = req.query.search;
                    URL = req.user.baseURL + GitlabURLs.MERGE_REQUEST_SEARCH_MERGED(searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.MERGE_REQUEST_PAGE_MERGED(page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.MERGE_REQUESTS_MERGED;
                }
                break;
            default:
                if (req.query.search) {
                    const searchParam = req.query.search;
                    URL = req.user.baseURL + GitlabURLs.MERGE_REQUEST_SEARCH(searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.MERGE_REQUEST_PAGE(page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.MERGE_REQUESTS;
                }
                break;
        }

        const mergeRequests = await getMergeRequests(accessToken, URL);
        const render = req.query.render;
        req.session.selectedProject = null


        const renderOptions = {
            content: mergeRequests,
            displayName: req.user.displayName,
            avatarUrl: req.user.avatarUrl,
            contentType: '../partials/mergeRequestsGridlist.ejs',
            title: contentTitles.MERGE_REQUESTS,
            activeItem: state ? activeItem[state.toUpperCase()] : activeItem.ALL,
            state: state,
            selectedProject: req.session.selectedProject
        };

        if (render === renders.FULL) {
            res.render('pages/DashboardPage.ejs', renderOptions);
        } else if (render === renders.PARTIAL) {
            res.render('partials/mergeRequestsGridlist.ejs', renderOptions);
        } else {
            res.render('partials/content.ejs', renderOptions);
        }
    } catch (error) {
        next(error);
    }
});

router.get("/gitlab/project/:project_id", isLoggedIn, async (req, res, next) => {
    try {
        const accessToken = req.user.gitlabAccessToken;
        const projectId = req.params.project_id;
        const projectName = req.query.name;
        let URL;
        const state = req.query.state;

        switch (state) {
            case states.OPENED:
                if (req.query.search) {
                    const searchParam = req.query.search;
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REQUESTS_SEARCH_OPENED(projectId, searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REQUESTS_PAGE_OPENED(projectId, page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REQUESTS_OPENED(projectId);
                }
                break;
            case states.CLOSED:
                if (req.query.search) {
                    const searchParam = req.query.search;
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REQUESTS_SEARCH_CLOSED(projectId, searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REQUESTS_PAGE_CLOSED(projectId, page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REQUESTS_CLOSED(projectId);
                }
                break;
            case states.MERGED:
                if (req.query.search) {
                    const searchParam = req.query.search;
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REQUESTS_SEARCH_MERGED(projectId, searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REQUESTS_PAGE_MERGED(projectId, page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REQUESTS_MERGED(projectId);
                }
                break;
            default:
                if (req.query.search) {
                    const searchParam = req.query.search;
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REQUESTS_SEARCH_OPENED(projectId, searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REQUESTS_PAGE_OPENED(projectId, page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REQUESTS(projectId);
                }
                break;
        }

        const mergeRequests = await getMergeRequests(accessToken, URL);
        const render = req.query.render;

        req.session.selectedProject = {
            id: projectId,
            name: projectName
        };

        const renderOptions = {
            content: mergeRequests,
            displayName: req.user.displayName,
            avatarUrl: req.user.avatarUrl,
            contentType: '../partials/mergeRequestsGridlist.ejs',
            title: contentTitles.MERGE_REQUESTS,
            activeItem: state ? activeItem[state.toUpperCase()] : activeItem.ALL,
            state: state,
            selectedProject: req.session.selectedProject
        };

        if (render === renders.FULL) {
            res.render('pages/DashboardPage.ejs', renderOptions);
        } else if (render === renders.PARTIAL) {
            res.render('partials/mergeRequestsGridlist.ejs', renderOptions);
        } else {
            res.render('partials/content.ejs', renderOptions);
        }
    } catch (error) {
        next(error);
    }
});

router.get("/gitlab/total", isLoggedIn, async (req, res, next) => {
    try {
        const accessToken = req.user.gitlabAccessToken;
        let URL;
        const state = req.query.state;

        switch (state) {
            case states.OPENED:
                URL = req.user.baseURL + GitlabURLs.MERGE_REQUESTS_OPENED;
                break;
            case states.CLOSED:
                URL = req.user.baseURL + GitlabURLs.MERGE_REQUESTS_CLOSED;
                break;
            case states.MERGED:
                URL = req.user.baseURL + GitlabURLs.MERGE_REQUESTS_MERGED;
                break;
            default:
                URL = req.user.baseURL + GitlabURLs.MERGE_REQUESTS;
                break;
        }
        const mergeRequests = await getMergeRequests(accessToken, URL);
        res.render('partials/counter.ejs',{ total: mergeRequests.total });
    } catch (error) {
        next(error);
    }
});

router.get("/gitlab/project/:project_id/total", isLoggedIn, async (req, res, next) => {
    try {
        const accessToken = req.user.gitlabAccessToken;
        const projectId = req.params.project_id;
        const state = req.query.state;

        let URL;

        switch (state) {
            case states.OPENED:
                URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REQUESTS_OPENED(projectId);
                break;
            case states.CLOSED:
                URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REQUESTS_CLOSED(projectId);
                break;
            case states.MERGED:
                URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REQUESTS_MERGED(projectId);
                break;
            default:
                URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REQUESTS(projectId);
                break;
        }

        const mergeRequests = await getMergeRequests(accessToken, URL);

        res.send(`<span class="counter total">${mergeRequests.total}</span>`);
    } catch (error) {
        next(error);
    }
});

router.get("/gitlab/project/:project_id/merge_request/:merge_request_id", isLoggedIn, async (req, res, next) => {
    try {
        const accessToken = req.user.gitlabAccessToken;
        const projectId = req.params.project_id;
        const mergeId = req.params.merge_request_id;

        const URL = req.user.baseURL + GitlabURLs.MERGE_REQUEST(projectId, mergeId);
        const merge_request = await getMergeRequest(accessToken, URL);
        res.render('pages/DashboardPage.ejs', {
            content: merge_request,
            displayName: req.user.displayName,
            avatarUrl: req.user.avatarUrl,
            contentType: '../partials/mergeRequest.ejs',
            title: contentTitles.MERGE_REQUEST,
            activeItem: activeItem.NONE,
            state: states.NONE,
            selectedProject: req.session.selectedProject
        });
    } catch (error) {
        next(error);
    }
});

router.post("/gitlab/project/:project_id/merge_request/:merge_request_id/notes", isLoggedIn, sanitizeBody, async (req, res, next) => {
    try {
        const accessToken = req.user.gitlabAccessToken;
        const projectID = req.params.project_id;
        const mergeId = req.params.merge_request_id;
        const note = req.body.noteContent;

        if (!note) {
            return res.status(400).send('Note content is required.');
        }
        const URL = req.user.baseURL + GitlabURLs.CREATE_MERGE_REQUEST_NOTE(projectID, mergeId, note);
        const newNote = await createMergeRequestNote(accessToken, URL);
        res.status(201);
    } catch (error) {
        next(error);
    }
});

router.delete("/gitlab/project/:project_id/merge_request/:merge_request_id/notes/:note_id", isLoggedIn, sanitizeBody, async (req, res, next) => {
    try {
        const accessToken = req.user.gitlabAccessToken;
        const projectId = req.params.project_id;
        const mergeId = req.params.merge_request_id;
        const noteId = req.params.note_id;

        const URL = req.user.baseURL + GitlabURLs.DELETE_MERGE_REQUEST_NOTE(projectId,mergeId,noteId);
        await deleteMergeRequestNote(accessToken, URL);
        res.send("");
    } catch (error) {
        next(error);
    }
});

export default router;
