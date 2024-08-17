import {getProjects} from "./projectsService.mjs";
import {api} from "../integration/api.mjs";
import {httpMethods} from "../resources/httpMethods.mjs";
import {GitlabURLs} from "../resources/gitlabURLs.mjs";
import {config} from "dotenv";

config()

const {GITLAB_WEBHOOK_SECRET } = process.env;


export async function createWebhook(accessToken, URL) {
    const webhookToken = GITLAB_WEBHOOK_SECRET;

    if (!webhookToken) {
        throw new Error('Webhook token is not defined in the environment variables.');
    }

    try {
        const { data: existingWebhooks } = await api(accessToken, URL, httpMethods.GET);

        const webhookUrl = 'https://hkdk.events/etibtezsc6k9x9';

        const webhookExists = existingWebhooks.some(hook => hook.url === webhookUrl);

        if (webhookExists) {
            console.log(`Webhook already exists.`);
        } else {
            const webhookBody = {
                url: webhookUrl,
                token: webhookToken,
                push_events: true,
                issues_events: true,
                confidential_issues_events: true,
                merge_requests_events: true,
            };

            const { data: webhookResponse } = await api(accessToken, URL, httpMethods.POST, webhookBody);
            console.log(`Webhook created successfully.`);
        }
    } catch (error) {
        console.error(`Failed to process webhook: ${error.message}`);
    }
}

export async function createWebhookNotes(accessToken, URL) {
    const webhookToken = GITLAB_WEBHOOK_SECRET;

    if (!webhookToken) {
        throw new Error('Webhook token is not defined in the environment variables.');
    }

    try {
        const { data: existingWebhooks } = await api(accessToken, URL, httpMethods.GET);

        const webhookUrl = 'https://hkdk.events/etibtezsc6k9x9/notes'; // Replace with your webhook URL

        const webhookExists = existingWebhooks.some(hook => hook.url === webhookUrl);

        if (webhookExists) {
            console.log(`Note Webhook already exists.`);
        } else {
            const webhookBody = {
                url: webhookUrl,
                token: webhookToken,
                push_events: false,
                note_events: true,
                confidential_note_events: true,
            };

            const { data: webhookResponse } = await api(accessToken, URL, httpMethods.POST, webhookBody);
            console.log(`Note Webhook created successfully.`);
        }
    } catch (error) {
        console.error(`Failed to process webhook: ${error.message}`);
    }
}
