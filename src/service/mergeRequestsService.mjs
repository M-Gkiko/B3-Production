import {api} from '../integration/api.mjs';
import {extractHeaders} from "./utils/extractHeaders.mjs";
import {getPagination} from "./utils/getPagination.mjs";
import {elapsedTime} from "./utils/dateFormat.mjs";
import {GitlabURLs} from "../resources/gitlabURLs.mjs";
import {convertToMarkdown} from "./utils/convertToMD.mjs";
import {httpMethods} from "../resources/httpMethods.mjs";

export async function getMergeRequests(accessToken, URL) {
    try {
        const mergeRequestsResponse = await api(accessToken, URL);

        const headers = extractHeaders(mergeRequestsResponse);

        const paginationRange = getPagination(headers.currentPage, headers.totalPages, 1);

        const mergeRequests = mergeRequestsResponse.data.map(request => ({
            projectId: request.project_id,
            id: request.iid,
            title: request.title,
            createdAt: elapsedTime(request.created_at),
            name: request.author.name,
            references: request.references.full,
            targetBranch: request.target_branch,
            labels: request.labels,
            noteCount: request.user_notes_count,
            state: request.state
        }));
        return {
            mergeRequests: mergeRequests,
            total: headers.total,
            paginationRange: paginationRange,
            totalPages: headers.totalPages,
            currentPage: headers.currentPage,
            prevPage: headers.prevPage,
            nextPage: headers.nextPage
        };


    } catch (error) {
        throw new Error(`Failed to retrieve merge requests: ${error.message}`);
    }
}

export async function getMergeRequest(accessToken, URL) {
    try {
        const baseUrl = URL.substring(0, URL.indexOf('api'));

        const mergeResponse = await api(accessToken, URL);

        const mergeNotesURL = baseUrl + GitlabURLs.MERGE_NOTES_SORTED(mergeResponse.data.project_id, mergeResponse.data.iid);
        const mergeNotesResponse = await api(accessToken, mergeNotesURL);

        const mergeNotesPromises = mergeNotesResponse.data.map(async note => {
            return {
                projectId: note.project_id,
                issueId: note.noteable_iid,
                id: note.id,
                body: convertToMarkdown(note.body),
                name: note.author.name,
                username: note.author.username,
                createdAt: elapsedTime(note.created_at),
                system: note.system,
                avatar: note.author.avatar_url,
            };
        });

        const mergeNotesList = await Promise.all(mergeNotesPromises);

        return {
            mergeRequest: {
                projectId: mergeResponse.data.project_id,
                id: mergeResponse.data.iid,
                title: mergeResponse.data.title,
                description: convertToMarkdown(mergeResponse.data.description),
                state: mergeResponse.data.state,
                createdAt: elapsedTime(mergeResponse.data.created_at),
                assignees: mergeResponse.data.assignees,
                reviewers: mergeResponse.data.reviewers,
                name: mergeResponse.data.author.name,
                username: mergeResponse.data.author.username,
                labels: mergeResponse.data.labels,
                targetBranch: mergeResponse.data.target_branch,
                sourceBranch: mergeResponse.data.source_branch,
            },
            mergeRequestNotes: mergeNotesList
        };

    } catch (error) {
        throw new Error(`Failed to retrieve merge request: ${error.message}`);
    }
}

export async function createMergeRequestNote(accessToken, URL) {
    try {
        const mergeRequestNoteResponse = await api(accessToken, URL, httpMethods.POST);
        return {
            projectId: mergeRequestNoteResponse.data.project_id,
            mergeRequestId: mergeRequestNoteResponse.data.noteable_iid,
            id: mergeRequestNoteResponse.data.id,
            body: convertToMarkdown(mergeRequestNoteResponse.data.body),
            name: mergeRequestNoteResponse.data.author.name,
            username: mergeRequestNoteResponse.data.author.username,
            createdAt: elapsedTime(mergeRequestNoteResponse.data.created_at),
            system: mergeRequestNoteResponse.data.system,
            avatar: mergeRequestNoteResponse.data.author.avatar_url
        };
    } catch (error) {
        throw new Error(`Failed to post note: ${error.message}`);
    }
}

export async function deleteMergeRequestNote(accessToken, URL) {
    try {
        await api(accessToken, URL, httpMethods.DELETE);
    } catch (error) {
        throw new Error(`Failed to delete note: ${error.message}`);
    }
}


