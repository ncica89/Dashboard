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

    // Get all checkboxes for columns
    var columnCheckboxes = document.querySelectorAll('.column-toggle');

    // Get the "View All" button and all checkboxes
    const selectAllButton = document.getElementById('selectAllColumns');

    // Add click event listener to "View All" button
    selectAllButton.addEventListener('click', function() {
        checkAllCheckboxes();
    });

    // Handle checkbox change event
    columnCheckboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            var columnId = checkbox.id.replace('toggleColumn', ''); // Extract column number from checkbox ID
            var columnIndex = parseInt(columnId); // Convert column number to zero-based index
            var table = document.querySelector('table');
            var tableRows = table.rows;

            // Toggle visibility of the column in the table
            for (var i = 0; i < tableRows.length; i++) {
                var cells = tableRows[i].cells;
                if (cells.length > columnIndex) {
                    var cell = cells[columnIndex];
                    cell.style.display = checkbox.checked ? '' : 'none';
                }
            }
        });
    });

    function populateTable(data) {
        tableBody.innerHTML = '';
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            // Check if "Geoserver Title" is 'Not available'
            if (item["Geoserver Title"] === 'Not available') {
                row.style.backgroundColor = 'red';
                item["hasRedBackground"] = true;  // Indicate the row should be red
            } else {
                item["hasRedBackground"] = false;
            }
            // Populate all attributes into the table row
            row.innerHTML = `
                <th>${index + 1}</th>
                <td>${item["Geoserver Title"]}</td>
                <td>${item["Geoserver WMS name"]}</td>
                <td>${item["Geoportal Name"]}</td>
                <td>${item["Geoportal Topic"]}</td>
                <td>${item["Geoserver Stores"]}</td>
                <td>${item["Source"]}</td>
                <td>${item["Data"]}</td>
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
            updateDashboardTitle(event);
            activateLink(event);
            const portalId = this.getAttribute('id');
            clearTable();
            fetchGeoportalData(portalId);
            showAllHeaders(); // Call function to show all headers
            checkAllCheckboxes(); // Call function to check all checkboxes
        });
    });

    // Function to show all table headers
    function showAllHeaders() {
        const tableHeaders = document.querySelectorAll('th');
        tableHeaders.forEach(header => {
            header.style.display = 'table-cell'; // Ensure all headers are visible
        });
    }

    // Function to check all checkboxes
    function checkAllCheckboxes() {
        console.log('Checking all checkboxes...'); // Debugging log

        // Select checkboxes within the dropdown menu
        const dropdownCheckboxes = document.querySelectorAll('.dropdown-menu .column-toggle');

        dropdownCheckboxes.forEach(function(checkbox) {
            checkbox.checked = true;
            var columnId = checkbox.id.replace('toggleColumn', ''); // Extract column number from checkbox ID
            console.log('Checkbox ID:', checkbox.id); // Debugging log
            console.log('Column ID:', columnId); // Debugging log
            var columnIndex = parseInt(columnId) - 1; // Convert column number to zero-based index

            // Toggle visibility of the column in the table
            var table = document.querySelector('table');
            var tableRows = table.rows;

            // Convert NodeList to Array for compatibility with forEach
            Array.from(tableRows).forEach(function(row) {
                var cells = row.cells;
                if (cells.length > columnIndex) {
                    var cell = cells[columnIndex];
                    cell.style.display = checkbox.checked ? '' : 'none';
                }
            });
        });

        console.log('All checkboxes checked.'); // Debugging log
    }

    function updateDashboardTitle(event) {
        const linkText = event.target.textContent.trim();
        const exportButton = document.getElementById('exportButton');
        dashboardTitle.innerHTML = `Pregled servisa izvora podataka > ${linkText}`;
        dashboardTitle.appendChild(exportButton); // Append export button after updating the title
        dashboardTitle.classList.add('responsive-span'); // Add a class to the span for responsive font size
    }

    function activateLink(event) {
        sidebarLinks.forEach(link => {
            link.classList.remove('active');
        });
        event.target.classList.add('active');
    }

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
                "Geoserver Stores": cells[4].innerText,
                "Source": cells[5].innerText,
                "Data": cells[6].innerText,
                "hasRedBackground": row.style.backgroundColor === 'red'
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