export const GitlabRoles = {
    MINIMAL_ACCESS: 'Minimal Access',
    GUEST: 'Guest',
    DEVELOPER: 'Developer',
    MAINTAINER: 'Maintainer',
    OWNER: 'Owner'
};

export function getRoleString(permissionLevel) {
    switch (permissionLevel) {
        case 5:
            return GitlabRoles.MINIMAL_ACCESS;
        case 10:
            return GitlabRoles.GUEST;
        case 30:
            return GitlabRoles.DEVELOPER;
        case 40:
            return GitlabRoles.MAINTAINER;
        case 50:
            return GitlabRoles.OWNER;
        default:
            return 'Unknown Role';
    }
}
