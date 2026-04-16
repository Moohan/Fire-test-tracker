"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format, startOfYear, endOfYear } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import JSZip from "jszip";
import Papa from "papaparse";

interface EquipmentListIcon {
  id: string;
  externalId: string;
  name: string;
  location: string;
  sfrsId: string | null;
  mfrId: string | null;
  expiryDate: string | null;
  statutoryExamination: boolean;
  requirements?: Array<{ frequency: string }>;
}

interface LogEntry {
  id: string;
  equipmentId: string;
  timestamp: string;
  type: string;
  testCode: string | null;
  result: string;
  notes: string | null;
  hoursUsed: string | null;
  equipment: EquipmentListIcon;
  user: {
    fullName: string | null;
    username: string;
  };
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(
    format(startOfYear(new Date()), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(
    format(endOfYear(new Date()), "yyyy-MM-dd"),
  );
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: equipment, isLoading } = useQuery<EquipmentListIcon[]>({
    queryKey: ["equipment-list"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch equipment");
      return res.json();
    },
  });

  const filteredEquipment =
    equipment
      ?.filter(
        (e) =>
          e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.externalId.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort((a, b) => a.name.localeCompare(b.name)) || [];

  const toggleEquipment = (id: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleDownloadCSV = async () => {
    setIsDownloading(true);
    try {
      const ids =
        selectedEquipment.length > 0
          ? selectedEquipment
          : equipment?.map((e) => e.id) || [];
      const res = await fetch(
        `/api/reports/logs?start=${startDate}&end=${endDate}&ids=${ids.join(",")}`,
      );
      const logs: LogEntry[] = await res.json();

      const headers = [
        "Date",
        "Equipment",
        "SFRS ID",
        "Test Code",
        "Result",
        "Defects/Notes",
        "Actions/Hours",
        "Tester",
      ];
      const data = logs.map((log) => [
        format(new Date(log.timestamp), "dd/MM/yyyy"),
        log.equipment.name,
        log.equipment.sfrsId || "",
        log.testCode || log.type,
        log.result,
        log.notes || "",
        log.hoursUsed || "",
        log.user.fullName || log.user.username,
      ]);

      // Using PapaParse for robust CSV generation with proper escaping
      const csvContent = Papa.unparse({
        fields: headers,
        data: data,
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `test_logs_${startDate}_${endDate}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to download CSV");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const ids =
        selectedEquipment.length > 0
          ? selectedEquipment
          : equipment?.map((e) => e.id) || [];
      const res = await fetch(
        `/api/reports/logs?start=${startDate}&end=${endDate}&ids=${ids.join(",")}`,
      );
      const allLogs: LogEntry[] = await res.json();

      const zip = new JSZip();

      for (const id of ids) {
        const item = equipment?.find((e) => e.id === id);
        if (!item) continue;

        const logs = allLogs.filter((l) => l.equipmentId === id);

        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text("Equipment Information Card Test Record", 105, 20, {
          align: "center",
        });
        doc.setFontSize(10);
        doc.text(
          "All inspections and tests must be carried out complying with the information and guidance contained, as a minimum, within the SFRS Operational Equipment Management Policy",
          105,
          30,
          { align: "center", maxWidth: 180 },
        );

        autoTable(doc, {
          startY: 40,
          head: [],
          body: [
            [
              "Equipment Description",
              item.name,
              "SFRS ID No.",
              item.sfrsId || "",
            ],
            [
              "Manufacturer Serial No.",
              item.mfrId || "",
              "Test Frequencies",
              item.requirements?.map((r) => r.frequency).join(", ") || "",
            ],
            [
              "Expiry / Removal date",
              item.expiryDate
                ? format(new Date(item.expiryDate), "dd/MM/yyyy")
                : "",
              "Subject to statutory examination",
              item.statutoryExamination ? "YES" : "NO",
            ],
          ],
          theme: "grid",
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 40 },
            2: { fontStyle: "bold", cellWidth: 40 },
          },
        });

        doc.setFontSize(8);
        const lastY =
          (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable
            ?.finalY || 60;
        doc.text(
          "Test Codes: A-Acceptance, U-After Use, M-Monthly, Q-Quarterly, C-Commencement of Duty, W-Weekly, 12-Annually, OIC-On Instruction",
          14,
          lastY + 5,
        );

        autoTable(doc, {
          startY: lastY + 10,
          head: [
            [
              "Date",
              "Test Code",
              "Result (P/F)",
              "Defects",
              "Actions/Hours Used",
              "Name (Print)",
              "Sign",
              "QA",
            ],
          ],
          body: logs.map((log) => [
            format(new Date(log.timestamp), "dd/MM/yyyy"),
            log.testCode || log.type.charAt(0),
            log.result.charAt(0),
            log.notes || "",
            log.hoursUsed || "",
            log.user.fullName || log.user.username,
            (log.user.fullName || log.user.username)
              .split(" ")
              .map((n) => n[0])
              .join(""),
            "",
          ]),
          theme: "grid",
          styles: { fontSize: 7 },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: "bold",
          },
        });

        zip.file(
          `${item.externalId}_${item.name.replace(/[^a-z0-9]/gi, "_")}.pdf`,
          doc.output("blob"),
        );
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `equipment_logs_${startDate}_${endDate}.zip`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF ZIP");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-6">
      <header className="max-w-4xl mx-auto w-full mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-sfrs-red hover:underline mb-1 inline-block"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Reports & Export</h1>
      </header>

      <main className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              1. Select Date Range
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  FROM
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  TO
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                2. Select Equipment (Default All)
              </h2>
              <span className="text-xs text-slate-500">
                {selectedEquipment.length} selected
              </span>
            </div>
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 text-sm mb-4"
            />
            <div className="max-h-64 overflow-y-auto border border-slate-100 rounded">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  Loading...
                </div>
              ) : (
                filteredEquipment.map((e) => (
                  <label
                    key={e.id}
                    className="flex items-center p-3 hover:bg-slate-50 border-b last:border-0 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEquipment.includes(e.id)}
                      onChange={() => toggleEquipment(e.id)}
                      className="mr-3 h-4 w-4 text-sfrs-red"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {e.name}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase">
                        {e.externalId} • {e.location}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
            {selectedEquipment.length > 0 && (
              <button
                onClick={() => setSelectedEquipment([])}
                className="mt-3 text-xs text-sfrs-red font-bold hover:underline"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 sticky top-24">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">
              3. Actions
            </h2>
            <div className="space-y-3">
              <button
                onClick={handleDownloadCSV}
                disabled={isDownloading || isLoading}
                className="w-full bg-white border border-slate-300 text-slate-700 font-bold py-3 px-4 rounded shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center justify-center min-h-[48px]"
              >
                Download CSV
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading || isLoading}
                className="w-full bg-sfrs-red text-white font-bold py-3 px-4 rounded shadow-lg hover:bg-sfrs-red/90 disabled:opacity-50 transition-all flex items-center justify-center min-h-[48px]"
              >
                {isDownloading ? "Generating..." : "Download PDF (ZIP)"}
              </button>
            </div>
            <p className="mt-6 text-[10px] text-slate-400 leading-tight">
              PDF reports are formatted as Equipment Information Card (EIC) Test
              Records.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
