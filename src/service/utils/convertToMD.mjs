import showdown from 'showdown';

export function convertToMarkdown(text) {
    const converter = new showdown.Converter();
    return converter.makeHtml(text);
}
