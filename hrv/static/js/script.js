// Example JavaScript for interactivity on the visual page
document.addEventListener('DOMContentLoaded', function() {
    console.log('JavaScript file loaded successfully!');

    // Example: Highlight the highest value in the table
    const table = document.getElementById('hrv_table');
    if (table) {
        const rows = table.getElementsByTagName('tr');
        Array.from(rows).forEach(row => {
            const cells = row.getElementsByTagName('td');
            Array.from(cells).forEach(cell => {
                const value = parseFloat(cell.innerText);
                if (value > 100) { // example threshold
                    cell.style.color = 'red';
                }
            });
        });
    }
});
