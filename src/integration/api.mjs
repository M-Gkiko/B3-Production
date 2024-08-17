import { httpMethods } from "../resources/httpMethods.mjs";

export async function api(accessToken, URL, method = httpMethods.GET, body = null) {
    try {
        const response = await fetch(URL, {
            method: `${method}`,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : null // Include the body if it exists
        });

        if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const responseData = await response.json();
                return {
                    data: responseData,
                    headers: response.headers
                };
            } else {
                const responseBody = await response.text();
                return {
                    data: responseBody,
                    headers: response.headers
                };
            }
        } else {
            const errorResponseData = await response.json();
            const errorMessage = errorResponseData.message || `${response.status} ${response.statusText}`;
            throw new Error(`Failed to fetch data from ${URL}: ${errorMessage}`);
        }
    } catch (error) {
        throw new Error(`Failed to fetch data from ${URL}: ${error.message}`);
    }
}
