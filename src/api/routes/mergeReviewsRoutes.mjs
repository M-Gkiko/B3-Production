import express from "express";
import {getMergeRequests} from "../../service/mergeRequestsService.mjs";
import {isLoggedIn} from "../middleware/isLoggedIn.mjs";
import {GitlabURLs} from "../../resources/gitlabURLs.mjs";
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
        const userId = req.user.id;

        switch (state) {
            case states.OPENED:
                if (req.query.search) {
                    const searchParam = req.query.search;
                    URL = req.user.baseURL + GitlabURLs.MERGE_REVIEWS_SEARCH_OPENED(userId, searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.MERGE_REVIEWS_PAGE_OPENED(userId, page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.MERGE_REVIEWS_OPENED(userId);
                }
                break;
            case states.CLOSED:
                if (req.query.search) {
                    const searchParam = req.query.search;
                    URL = req.user.baseURL + GitlabURLs.MERGE_REVIEWS_SEARCH_CLOSED(userId, searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.MERGE_REVIEWS_PAGE_CLOSED(userId, page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.MERGE_REVIEWS_CLOSED(userId);
                }
                break;
            case states.MERGED:
                if (req.query.search) {
                    const searchParam = req.query.search;
                    URL = req.user.baseURL + GitlabURLs.MERGE_REVIEWS_SEARCH_MERGED(userId, searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.MERGE_REVIEWS_PAGE_MERGED(userId, page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.MERGE_REVIEWS_MERGED(userId);
                }
                break;
            default:
                if (req.query.search) {
                    const searchParam = req.query.search;
                    URL = req.user.baseURL + GitlabURLs.MERGE_REVIEWS_SEARCH(userId, searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.MERGE_REVIEWS_PAGE(userId, page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.MERGE_REVIEWS(userId);
                }
                break;
        }

        const mergeReviews = await getMergeRequests(accessToken, URL);
        const render = req.query.render;
        req.session.selectedProject = null

        const renderOptions = {
            content: mergeReviews,
            displayName: req.user.displayName,
            avatarUrl: req.user.avatarUrl,
            contentType: '../partials/mergeRequestsGridlist.ejs',
            title: contentTitles.MERGE_REVIEWS,
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
        const userId = req.user.id;
        let URL;
        const state = req.query.state;
        const projectName = req.query.name;

        switch (state) {
            case states.OPENED:
                if (req.query.search) {
                    const searchParam = req.query.search;
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REVIEWS_SEARCH_OPENED(projectId, userId, searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REVIEWS_PAGE_OPENED(projectId, userId, page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REVIEWS_OPENED(projectId, userId);
                }
                break;
            case states.CLOSED:
                if (req.query.search) {
                    const searchParam = req.query.search;
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REVIEWS_SEARCH_CLOSED(projectId, userId, searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REVIEWS_PAGE_CLOSED(projectId, userId, page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REVIEWS_CLOSED(projectId, userId);
                }
                break;
            case states.MERGED:
                if (req.query.search) {
                    const searchParam = req.query.search;
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REVIEWS_SEARCH_MERGED(projectId, userId, searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REVIEWS_PAGE_MERGED(projectId, userId, page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REVIEWS_MERGED(projectId, userId);
                }
                break;
            default:
                if (req.query.search) {
                    const searchParam = req.query.search;
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REVIEWS_SEARCH(projectId, userId, searchParam);
                } else if (req.query.page) {
                    const page = req.query.page;
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REVIEWS_PAGE(projectId, userId, page);
                } else {
                    URL = req.user.baseURL + GitlabURLs.PROJECT_MERGE_REVIEWS(projectId, userId);
                }
                break;
        }

        req.session.selectedProject = {
            id: projectId,
            name: projectName
        };


        const mergeReviews = await getMergeRequests(accessToken, URL);
        const render = req.query.render;

        const renderOptions = {
            content: mergeReviews,
            displayName: req.user.displayName,
            avatarUrl: req.user.avatarUrl,
            contentType: '../partials/mergeReviewsGridlist.ejs',
            title: contentTitles.MERGE_REVIEWS,
            activeItem: state ? activeItem[state.toUpperCase()] : activeItem.ALL,
            state: state,
            selectedProject:  req.session.selectedProject
        };

        if (render === renders.FULL) {
            res.render('pages/DashboardPage.ejs', renderOptions);
        } else if (render === renders.PARTIAL) {
            res.render('partials/mergeReviewsGridlist.ejs', renderOptions);
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
        const userId = req.user.id;

        switch (state) {
            case states.OPENED:
                URL = req.user.baseURL + GitlabURLs.MERGE_REVIEWS_OPENED(userId);
                break;
            case states.CLOSED:
                URL = req.user.baseURL + GitlabURLs.MERGE_REVIEWS_CLOSED(userId);
                break;
            case states.MERGED:
                URL = req.user.baseURL + GitlabURLs.MERGE_REVIEWS_MERGED(userId);
                break;
            default:
                URL = req.user.baseURL + GitlabURLs.MERGE_REVIEWS(userId);
                break;
        }
        const mergeReviews = await getMergeRequests(accessToken, URL);
        res.render('partials/counter.ejs',{ total: mergeReviews.total });
    } catch (error) {
        next(error);
    }
});

export default router;
