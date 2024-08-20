import express from "express";
import {
    changeIssueState,
    deleteIssueNote,
    getIssues,
    getIssue,
    createIssueNote
} from "../../service/issuesService.mjs";
import {isLoggedIn} from "../middleware/isLoggedIn.mjs";
import {GitlabURLs} from "../../resources/gitlabURLs.mjs";
import {sanitizeBody} from "../middleware/sanitizeBody.mjs";
import {contentTitles} from "../../resources/contentTitles.mjs";
import {activeItem} from "../../resources/activeItem.mjs";
import {states} from "../../resources/states.mjs";
import {renders} from "../../resources/renders.mjs";

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
                    URL = req.user.baseURL + GitlabURLs.ISSUES_SEARCH_OPENED(searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.ISSUES_PAGE_OPENED(page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.ISSUES_OPENED;
                }
                break;
            case states.CLOSED:
                if (req.query.search) {
                    const searchParam = req.query.search;
                    URL = req.user.baseURL + GitlabURLs.ISSUES_SEARCH_CLOSED(searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.ISSUES_PAGE_CLOSED(page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.ISSUES_CLOSED;
                }
                break;
            default:
                if (req.query.search) {
                    const searchParam = req.query.search;
                    URL = req.user.baseURL + GitlabURLs.ISSUES_SEARCH(searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.ISSUES_PAGE(page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.ISSUES;
                }
                break;
        }

        const issues = await getIssues(accessToken, URL);
        const render = req.query.render;

        req.session.selectedProject = null

            const renderOptions = {
            content: issues,
            displayName: req.user.displayName,
            avatarUrl: req.user.avatarUrl,
            contentType: '../partials/issuesGridlist.ejs',
            title: contentTitles.ISSUES,
            activeItem: state ? activeItem[state.toUpperCase()] : activeItem.ALL,
            state: state,
                selectedProject: req.session.selectedProject
        };

        if (render === renders.FULL) {
            res.render('pages/DashboardPage.ejs', renderOptions);
        } else if (render === renders.PARTIAL) {
            res.render('partials/issuesGridlist.ejs', renderOptions);
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
                URL = req.user.baseURL + GitlabURLs.ISSUES_OPENED;
                break;
            case states.CLOSED:
                URL = req.user.baseURL + GitlabURLs.ISSUES_CLOSED;
                break;
            default:
                URL = req.user.baseURL + GitlabURLs.ISSUES;
                break;
        }
        const issues = await getIssues(accessToken, URL);
        res.render('partials/counter.ejs',{ total: issues.total });
    } catch (error) {
        next(error);
    }
});

router.get("/gitlab/project/:project_id", isLoggedIn, async (req, res, next) => {
    try {
        const accessToken = req.user.gitlabAccessToken;
        const projectId = req.params.project_id;
        let URL;
        const state = req.query.state;
        const projectName = req.query.name;
        const searchParam = req.query.search;
        const page = req.query.page;

        switch (state) {
            case states.OPENED:
                if (searchParam) {
                    URL = req.user.baseURL + GitlabURLs.PROJECT_ISSUES_SEARCH_OPENED(projectId, searchParam);
                } else if (page) {
                    URL = req.user.baseURL + GitlabURLs.PROJECT_ISSUES_PAGE_OPENED(projectId, page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.PROJECT_ISSUES_OPENED(projectId);
                }
                break;
            case states.CLOSED:
                if (searchParam) {
                    URL = req.user.baseURL + GitlabURLs.PROJECT_ISSUES_SEARCH_CLOSED(projectId, searchParam);
                } else if (page) {
                    URL = req.user.baseURL + GitlabURLs.PROJECT_ISSUES_PAGE_CLOSED(projectId, page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.PROJECT_ISSUES_CLOSED(projectId);
                }
                break;
            default:
                if (searchParam) {
                    URL = req.user.baseURL + GitlabURLs.PROJECT_ISSUES_SEARCH(projectId, searchParam);
                } else if (page) {
                    URL = req.user.baseURL + GitlabURLs.PROJECT_ISSUES_PAGE(projectId, page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.PROJECT_ISSUES(projectId);
                }
                break;
        }

        const issues = await getIssues(accessToken, URL);

        const render = req.query.render;

        req.session.selectedProject = {
            id: projectId,
            name: projectName
        };

        const renderOptions = {
            content: issues,
            displayName: req.user.displayName,
            avatarUrl: req.user.avatarUrl,
            contentType: '../partials/issuesGridlist.ejs',
            title: contentTitles.ISSUES,
            activeItem: state ? activeItem[state.toUpperCase()] : activeItem.ALL,
            state: state,
            selectedProject: req.session.selectedProject
        };

        if (render === renders.FULL) {
            res.render('pages/DashboardPage.ejs', renderOptions);
        } else if (render === renders.PARTIAL) {
            res.render('partials/issuesGridlist.ejs', renderOptions);
        } else {
            res.render('partials/content.ejs', renderOptions);
        }
    } catch (error) {
        next(error);
    }
});

router.get("/gitlab/project/:project_id/total", isLoggedIn, async (req, res, next) => {
    try {
        const accessToken = req.user.gitlabAccessToken;
        const state = req.query.state;
        const projectId = req.params.project_id;

        let URL;
        switch (state) {
            case states.OPENED:
                URL = req.user.baseURL + GitlabURLs.PROJECT_ISSUES_OPENED(projectId);
                break;
            case states.CLOSED:
                URL = req.user.baseURL + GitlabURLs.PROJECT_ISSUES_CLOSED(projectId);
                break;
            default:
                URL = req.user.baseURL + GitlabURLs.PROJECT_ISSUES(projectId);
                break;
        }
        const issues = await getIssues(accessToken, URL);
        res.send(`<span class="counter total">${issues.total}</span>`);
    } catch (error) {
        next(error);
    }
});

router.get("/gitlab/project/:project_id/issue/:issue_id", isLoggedIn, async (req, res, next) => {
    try {
        const accessToken = req.user.gitlabAccessToken;
        const projectID = req.params.project_id;
        const issueID = req.params.issue_id;
        const URL = req.user.baseURL + GitlabURLs.ISSUE(projectID, issueID);
        const issue = await getIssue(accessToken, URL);

        res.render('pages/DashboardPage.ejs', {
            content: issue,
            displayName: req.user.displayName,
            avatarUrl: req.user.avatarUrl,
            contentType: '../partials/issue.ejs',
            title: contentTitles.ISSUE,
            activeItem: activeItem.NONE,
            state: states.NONE,
            selectedProject:  req.session.selectedProject
    });
    } catch (error) {
        next(error);
    }
});

router.put("/gitlab/project/:project_id/issue/:issue_id", isLoggedIn, sanitizeBody, async (req, res, next) => {
    try {
        const accessToken = req.user.gitlabAccessToken;
        const projectID = req.params.project_id;
        const issueID = req.params.issue_id;
        const issueState = req.query.state;
        const URL = req.user.baseURL + GitlabURLs.ISSUE_STATE(projectID,issueID,issueState);
        await changeIssueState(accessToken, URL);
        res.set('HX-Redirect', `/issues/gitlab/project/${projectID}/issue/${issueID}`);
        res.status(204).end(); 
    } catch (error) {
        next(error);
    }
});

router.post("/gitlab/project/:project_id/issue/:issue_id/notes", isLoggedIn, sanitizeBody, async (req, res, next) => {
    try {
        const accessToken = req.user.gitlabAccessToken;
        const projectID = req.params.project_id;
        const issueID = req.params.issue_id;
        const note = req.body.noteContent;
        if (!note) {
            return res.status(400).send('Note content is required.');
        }
        const URL = req.user.baseURL + GitlabURLs.CREATE_ISSUE_NOTE(projectID, issueID, note);
        const newNote = await createIssueNote(accessToken, URL);
        res.status(201);
    } catch (error) {
        next(error);
    }
});

router.delete("/gitlab/project/:project_id/issue/:issue_id/notes/:note_id", isLoggedIn, sanitizeBody, async (req, res, next) => {
    try {
        const accessToken = req.user.gitlabAccessToken;
        const projectID = req.params.project_id;
        const issueID = req.params.issue_id;
        const noteID = req.params.note_id;
        const URL = req.user.baseURL + GitlabURLs.DELETE_ISSUE_NOTE(projectID,issueID,noteID);
         await deleteIssueNote(accessToken, URL);
        res.send("");
    } catch (error) {
        next(error);
    }
});

export default router;
