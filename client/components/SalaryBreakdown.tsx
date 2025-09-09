import React from "react";
import { computeSalaryFromCTC } from "@/lib/salary";

import type { SalaryConfig } from "@/lib/salary";

interface Props {
  ctc: number;
  config?: SalaryConfig | null;
  className?: string;
}

const fmt = (n: number) => {
  return `₹ ${n.toLocaleString()}`;
};

const SalaryBreakdown: React.FC<Props> = ({ ctc, config, className }) => {
  const data = computeSalaryFromCTC(ctc || 0, config || undefined);
  const rows: { label: string; month: number; year: number }[] = [
    { label: "CTC (PM)", month: ctc || 0, year: Math.round((ctc || 0) * 12) },
    {
      label: "Employer PF",
      month: data.employerPf,
      year: data.employerPf * 12,
    },
    {
      label: "Employer ESIC",
      month: data.employerEsic,
      year: data.employerEsic * 12,
    },
    {
      label: "Actual Gross",
      month: data.actualGross,
      year: data.actualGross * 12,
    },
    { label: "Basic", month: data.basicPay, year: data.basicPay * 12 },
    { label: "HRA", month: data.hra, year: data.hra * 12 },
    { label: "Conveyance", month: data.conveyance, year: data.conveyance * 12 },
    {
      label: "Gross Payable",
      month: data.grossPayable,
      year: data.grossPayable * 12,
    },
    {
      label: "Employee PF",
      month: data.employeePf,
      year: data.employeePf * 12,
    },
    { label: "ESIC", month: data.employeeEsic, year: data.employeeEsic * 12 },
    { label: "PT", month: data.pt, year: data.pt * 12 },
    {
      label: "Net Payable",
      month: data.netPayable,
      year: data.netPayable * 12,
    },
  ];

  return (
    <div className={className}>
      <div className="overflow-auto rounded border border-slate-700 bg-slate-800/30 p-2">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-slate-300">
              <th className="py-2 px-3">&nbsp;</th>
              <th className="py-2 px-3">Per month</th>
              <th className="py-2 px-3">Per year</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-slate-700">
                <td className="py-2 px-3 text-white">{r.label}</td>
                <td className="py-2 px-3 text-white">{fmt(r.month)}</td>
                <td className="py-2 px-3 text-white">{fmt(r.year)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalaryBreakdown;
