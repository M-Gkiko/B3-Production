import { api } from '../integration/api.mjs';
import { getRoleString } from "../resources/gitlabRoles.mjs";
import {getPagination} from "./utils/getPagination.mjs";
import {convertToMarkdown} from "./utils/convertToMD.mjs";
import {extractHeaders} from "./utils/extractHeaders.mjs";

export async function getProjects(accessToken, URL) {
    try {
        const projectsResponse = await api(accessToken, URL);

        const headers = extractHeaders(projectsResponse);

        const projectPromises = projectsResponse.data.map(async (projectData) => {
            let projectAccess = projectData.permissions.project_access || projectData.permissions.group_access;
            const role = getRoleString(projectAccess.access_level);
            return {
                id: projectData.id,
                imageUrl: projectData.avatar_url,
                name: projectData.name,
                nameWithNamespace: projectData.name_with_namespace,
                visibility: projectData.visibility,
                role: role,
                forkCount: projectData.forks_count,
                starCount: projectData.star_count,
            };
        });
        const projects = await Promise.all(projectPromises);

        const paginationRange = getPagination(headers.currentPage, headers.totalPages, 1)
        return {
            projects: projects,
            total: headers.total,
            paginationRange: paginationRange,
            totalPages: headers.totalPages,
            currentPage: headers.currentPage,
            prevPage: headers.prevPage,
            nextPage: headers.nextPage
        };
    } catch (error) {
        throw new Error(`Failed to retrieve projects: ${error.message}`);
    }
}

export async function getProjectReadMe(accessToken, URL) {
    try {
        const readMe = await api(accessToken, URL);
        return convertToMarkdown(readMe.data);
    } catch (error) {
    throw new Error(`Failed to retrieve README: ${error.message}`);
}
}
