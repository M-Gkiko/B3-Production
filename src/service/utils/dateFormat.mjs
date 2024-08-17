export function elapsedTime(dateString) {
    const currentDate = new Date();
    const pastDate = new Date(dateString);

    const timeDifference = currentDate - pastDate;
    const seconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (years > 1) {
        return pastDate.toLocaleDateString(); // Display full date if more than a year
    } else if (years === 1) {
        return pastDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long' }); // Display month and year if exactly one year
    } else if (months > 0) {
        return months === 1 ? 'a month ago' : `${months} months ago`;
    } else if (days > 0) {
        return days === 1 ? 'a day ago' : `${days} days ago`;
    } else if (hours > 0) {
        return hours === 1 ? 'an hour ago' : `${hours} hours ago`;
    } else if (minutes > 0) {
        return minutes === 1 ? 'a minute ago' : `${minutes} minutes ago`;
    } else {
        return 'just now';
    }
}

