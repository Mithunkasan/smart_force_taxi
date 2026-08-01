export function exportToCSV(filename: string, headers: string[], rows: any[][]) {
  const content = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((val) => {
          const cleanStr = String(val === null || val === undefined ? "" : val).replace(/"/g, '""');
          return `"${cleanStr}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
