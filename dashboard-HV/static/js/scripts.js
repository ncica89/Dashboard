document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.getElementById('tableBody');
    const searchTitle = document.getElementById('searchTitle');
    const searchWMSName = document.getElementById('searchWMSName');
    const searchGeoportalName = document.getElementById('searchGeoportalName');
    const searchGeoportalTopic = document.getElementById('searchGeoportalTopic');
    const searchSource = document.getElementById('searchSource');
    const searchServer = document.getElementById('searchServer');

    const dashboardTitle = document.getElementById('dashboard-title');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    const progressContainer = document.getElementById('progress-container');

    const exportButton = document.getElementById('exportButton');

    function populateTable(data) {
        tableBody.innerHTML = '';
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <th>${index + 1}</th>
                <td>${item["Geoserver Title"]}</td>
                <td>${item["Geoserver WMS name"]}</td>
                <td>${item["Geoportal Name"]}</td>
                <td>${item["Geoportal Topic"]}</td>
                <td>${item["Source"]}</td>
                <td>${item["Server"]}</td>
                <td>${item["SQL"]}</td>
            `;
            tableBody.appendChild(row);
        });
        exportButton.style.display = data.length ? 'block' : 'none'; // Show export button if there's data
    }

    function filterTable(event) {
        const filter = event.target.value.toUpperCase();
        const table = document.querySelector(".table");
        const rows = table.querySelectorAll("tbody tr");

        const columnIndex = event.target.parentNode.cellIndex;

        rows.forEach(row => {
            const cell = row.cells[columnIndex];
            if (cell) {
                const cellText = cell.textContent || cell.innerText;
                row.style.display = cellText.toUpperCase().indexOf(filter) > -1 ? "" : "none";
            }
        });
    }

    function fetchGeoportalData(portalId) {
        showProgressBar();
        fetch(`/services/combined?portal=${portalId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                window.geoportalData = data;
                populateTable(data);
            })
            .catch(error => console.error('Error:', error))
            .finally(() => hideProgressBar());
    }

    function clearTable() {
        tableBody.innerHTML = '';
    }

    function showProgressBar() {
        progressContainer.style.display = 'block';
    }

    function hideProgressBar() {
        progressContainer.style.display = 'none';
    }

    // Add click event listener to sidebar links
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const portalId = this.getAttribute('id');
            clearTable();
            fetchGeoportalData(portalId);
        });
    });

    function updateDashboardTitle(event) {
        const linkText = event.target.textContent.trim();
        const exportButton = document.getElementById('exportButton');
        dashboardTitle.innerHTML = `Pregled stanja na geoserveru > ${linkText}`;
        dashboardTitle.appendChild(exportButton); // Append export button after updating the title
    }

    function activateLink(event) {
        sidebarLinks.forEach(link => {
            link.classList.remove('active');
        });
        event.target.classList.add('active');
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            updateDashboardTitle(event);
            activateLink(event);
        });
    });

    // Add event listeners to input fields for filtering
    searchTitle.addEventListener('keyup', filterTable);
    searchWMSName.addEventListener('keyup', filterTable);
    searchGeoportalName.addEventListener('keyup', filterTable);
    searchGeoportalTopic.addEventListener('keyup', filterTable);
    searchSource.addEventListener('keyup', filterTable);
    searchServer.addEventListener('keyup', filterTable);

    // Add click event listener to export button
    exportButton.addEventListener('click', function() {
        console.log('Export button clicked'); // Debugging log
        const data = Array.from(tableBody.querySelectorAll('tr')).map(row => {
            const cells = row.querySelectorAll('td');
            return {
                "Geoserver Title": cells[0].innerText,
                "Geoserver WMS name": cells[1].innerText,
                "Geoportal Name": cells[2].innerText,
                "Geoportal Topic": cells[3].innerText,
                "Source": cells[4].innerText,
                "Server": cells[5].innerText,
                "SQL": cells[6].innerText,
            };
        });

        console.log('Export data:', data); // Debugging log

        fetch('services/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data })
        })
        .then(response => {
            if (response.ok) {
                return response.blob();
            } else {
                throw new Error('Export failed');
            }
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'geoportal_data.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            alert('Download finished successfully!'); // Popup message
        })
        .catch(error => console.error('Error:', error));
    });

});