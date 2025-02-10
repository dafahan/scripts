(function() {
    const table = document.querySelector("body > div.container > div > aside.right-side > section.content > div > div > div > div.box-body > div > div > div.table-responsive > table tbody");
    if (!table) {
        console.error("Table not found");
        return;
    }
    
    let schedule = [];
    let timeslots = new Set();
    let days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    
    let rows = table.querySelectorAll("tr");
    
    console.log("Total rows found:", rows.length);
    
    rows.forEach(row => {
        let cols = row.getElementsByTagName("td");
        if (!cols[5]) return;
        
        let scheduleEntries = cols[5].innerHTML.trim().split(/<br\s*\/?>/i);
        
        scheduleEntries.forEach(entry => {
            console.log("Processing entry:", entry);
            let match = entry.match(/^([^,]+),\s*([\d:.]+\s*s\.d\s*[\d:.]+)(?:\s*@\s*(.*))?$/);
            if (match) {
                let day = match[1];
                let time = match[2];
                let classroom = match[3] || "";
                timeslots.add(time);
                schedule.push({
                    day, time, classroom,
                    subject: cols[2].textContent.trim(),
                    class: cols[3].textContent.trim(),
                    sks: cols[4].textContent.trim()
                });
            }
        });
    });
    
    let sortedTimeslots = Array.from(timeslots).sort();
    
    let htmlOutput = `
        <div class="container mx-auto p-4">
            <h2 class="text-xl font-bold text-center mb-4">Lesson Timetable</h2>
            <div class="overflow-x-auto">
                <table class="table-auto w-full border-collapse border border-gray-300">
                    <thead>
                        <tr class="bg-gray-200">
                            <th class="border border-gray-300 px-4 py-2">Time</th>
                            ${days.map(day => `<th class="border border-gray-300 px-4 py-2">${day}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedTimeslots.map(time => `
                            <tr>
                                <td class="border border-gray-300 px-4 py-2 text-center">${time}</td>
                                ${days.map(day => {
                                    let subjectEntry = schedule.find(s => s.time === time && s.day === day);
                                    return subjectEntry ? 
                                        `<td class="border border-gray-300 px-4 py-2 text-center">
                                            <div>${subjectEntry.subject} (${subjectEntry.class})</div>
                                            ${subjectEntry.classroom ? `<div class="text-sm text-gray-500">${subjectEntry.classroom}</div>` : ''}
                                        </td>` :
                                        `<td class="border border-gray-300 px-4 py-2"></td>`;
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const newTab = window.open();
    newTab.document.write(`<!DOCTYPE html><html lang="en"><head><script src="https://cdn.tailwindcss.com"></script><title>Lesson Timetable</title></head><body class="bg-gray-100 p-4">${htmlOutput}</body></html>`);
    newTab.document.close();
})();
