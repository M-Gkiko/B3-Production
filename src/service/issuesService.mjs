import {api} from '../integration/api.mjs';
import {GitlabURLs} from "../resources/gitlabURLs.mjs";
import {elapsedTime} from "./utils/dateFormat.mjs";
import {convertToMarkdown} from "./utils/convertToMD.mjs";
import {getPagination} from "./utils/getPagination.mjs";
import {httpMethods} from "../resources/httpMethods.mjs";
import {extractHeaders} from "./utils/extractHeaders.mjs";

export async function getIssues(accessToken, URL) {
    try {
        const issueResponse = await api(accessToken, URL);

        const headers = extractHeaders(issueResponse);

        const paginationRange = getPagination(headers.currentPage, headers.totalPages, 1);

        const issues = issueResponse.data.map(issue => ({
            projectId: issue.project_id,
            id: issue.iid,
            title: issue.title,
            createdAt: elapsedTime(issue.created_at),
            name: issue.author.name,
            references: issue.references.full,
            labels: issue.labels,
            noteCount: issue.user_notes_count,
            mergeRequestsCount: issue.merge_requests_count,
            state: issue.state,
        }));
        return {
            issues: issues,
            total: headers.total,
            paginationRange: paginationRange,
            totalPages: headers.totalPages,
            currentPage: headers.currentPage,
            prevPage: headers.prevPage,
            nextPage: headers.nextPage
        };

    } catch (error) {
        throw new Error(`Failed to retrieve issues: ${error.message}`);
    }
}

export async function getIssue(accessToken, URL) {
    try {
        const baseUrl = URL.substring(0, URL.indexOf('api'));

        const issueResponse = await api(accessToken, URL);

        const issueNotesURL = baseUrl + GitlabURLs.ISSUE_NOTES_SORTED(issueResponse.data.project_id, issueResponse.data.iid);
        const issueNotesResponse = await api(accessToken, issueNotesURL);

        const issueNotesPromises = issueNotesResponse.data.map(async note => {
            return {
                projectId: note.project_id,
                issueId: note.noteable_iid,
                id: note.id,
                body: convertToMarkdown(note.body),
                name: note.author.name,
                username: note.author.username,
                createdAt: elapsedTime(note.created_at),
                system: note.system,
                avatar: note.author.avatar_url
            };
        });

        const issueNotesList = await Promise.all(issueNotesPromises);

        return {
            issue: {
                projectId: issueResponse.data.project_id,
                id: issueResponse.data.iid,
                title: issueResponse.data.title,
                description: convertToMarkdown(issueResponse.data.description),
                state: issueResponse.data.state,
                createdAt: elapsedTime(issueResponse.data.created_at),
                assignees: issueResponse.data.assignees,
                name: issueResponse.data.author.name,
                username: issueResponse.data.author.username,
                labels: issueResponse.data.labels
            },
            issueNotes: issueNotesList
        };

    } catch (error) {
        throw new Error(`Failed to retrieve issue: ${error.message}`);
    }
}

export async function changeIssueState(accessToken,URL){
    try {
        await api(accessToken, URL, httpMethods.PUT);
    } catch (error) {
        throw new Error(`Failed to change issue state: ${error.message}`);
    }
}

export async function createIssueNote(accessToken, URL) {
    try {
        const issueNoteResponse = await api(accessToken, URL, httpMethods.POST);
        return {
            projectId: issueNoteResponse.data.project_id,
            issueId: issueNoteResponse.data.noteable_iid,
            id: issueNoteResponse.data.id,
            body: convertToMarkdown(issueNoteResponse.data.body),
            name: issueNoteResponse.data.author.name,
            username: issueNoteResponse.data.author.username,
            createdAt: elapsedTime(issueNoteResponse.data.created_at),
            system: issueNoteResponse.data.system,
            avatar: issueNoteResponse.data.author.avatar_url
        };
    } catch (error) {
        throw new Error(`Failed to post note: ${error.message}`);
    }
}

export async function deleteIssueNote(accessToken,URL) {
    try {
         await api(accessToken, URL, httpMethods.DELETE);

    } catch (error) {
        throw new Error(`Failed to delete note: ${error.message}`);
    }

}
