import express from "express";
import {getProjects, getProjectReadMe} from "../../service/projectsService.mjs";
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
        const baseURL = req.user.baseURL;
        let URL;

        if (req.query.search) {
            const searchParam = req.query.search;
            URL = baseURL + GitlabURLs.PROJECT_SEARCH(searchParam);
        } else if (req.query.page) {
            const page = req.query.page;
            URL = baseURL + GitlabURLs.PROJECTS_PAGE(page);
        } else {
            URL = baseURL + GitlabURLs.PROJECTS;
        }

        const projectData = await getProjects(accessToken, URL);

        const render = req.query.render;
        req.session.selectedProject = null

        const renderOptions=  {
            content: projectData,
            displayName: req.user.displayName,
            avatarUrl: req.user.avatarUrl,
            contentType: '../partials/projectsGridlist.ejs',
            title: contentTitles.PROJECTS,
            activeItem: activeItem.NONE,
            state:'none',
            selectedProject: req.session.selectedProject
        }

        if (render === renders.FULL) {
            res.render('pages/DashboardPage.ejs', renderOptions);
        } else {
            res.render('partials/projectsGridlist.ejs', renderOptions);
        }
    } catch (error) {
        next(error);
    }
});

router.get("/gitlab/:project_id/readme", isLoggedIn, async (req, res, next) => {
    try {
        const accessToken = req.user.gitlabAccessToken;
        const projectId = req.params.project_id;
        const projectName = req.query.name;
        const URL = req.user.baseURL + GitlabURLs.PROJECT_README(projectId);

        const readMe = await getProjectReadMe(accessToken, URL);

        req.session.selectedProject = {
            id: projectId,
            name: projectName,
        };

        res.render('pages/DashboardPage.ejs', {
            content: readMe,
            displayName: req.user.displayName,
            avatarUrl: req.user.avatarUrl,
            contentType: '../partials/readmeContainer.ejs',
            title: contentTitles.README,
            activeItem: activeItem.NONE,
            state: states.NONE,
            selectedProject: req.session.selectedProject
        });

    } catch (error) {
        next(error);
    }
});

export default router;
