export type SalaryConfig = {
  basicRatio?: number;
  hraRatio?: number;
  conveyance?: number;
  pfPercent?: number;
  pt?: number;
  esicRate?: number;
  // allow passing explicit employee PF to be used as override when computing
  employeePfOverride?: number;
};

export function computeSalaryFromCTC(ctcPm: number, cfg?: SalaryConfig) {
  const conveyanceFixed = cfg?.conveyance ?? 1600;
  const ptFixed = cfg?.pt ?? 200;
  const esicRate = cfg?.esicRate ?? 0; // assume 0 by default
  const pfPercent = cfg?.pfPercent ?? 0.12; // 12% on basic
  const basicRatioCfg = cfg?.basicRatio ?? 0.5;
  const hraRatioCfg = cfg?.hraRatio ?? 0.4;

  // If employeePfOverride provided, use it directly to compute actualGross = ctc - employeePf
  const employeePfOverride = (cfg as any)?.employeePfOverride;
  let actualGross = 0;
  let basic = 0;
  let employerPf = 0;

  if (typeof employeePfOverride === "number") {
    // user supplied PF directly (employee PF), compute based on that
    employerPf = Math.round(employeePfOverride);
    actualGross = Math.round(ctcPm - employerPf);
    basic = Math.round(actualGross * basicRatioCfg);
  } else {
    // iterative approach because employer PF depends on basic which depends on actual gross which depends on employer PF
    for (let i = 0; i < 10; i++) {
      actualGross = Math.round(
        ctcPm - employerPf - Math.round(actualGross * esicRate),
      );
      basic = Math.round(actualGross * basicRatioCfg);
      const newEmployerPf = Math.round(basic * pfPercent);
      if (Math.abs(newEmployerPf - employerPf) <= 1) {
        employerPf = newEmployerPf;
        break;
      }
      employerPf = newEmployerPf;
    }
    // final actualGross
    actualGross = Math.round(
      ctcPm - employerPf - Math.round(actualGross * esicRate),
    );
    basic = Math.round(actualGross * basicRatioCfg);
  }

  const hra = Math.round(basic * (cfg?.hraRatio ?? hraRatioCfg));
  const conveyance = conveyanceFixed;
  const splAllowance = Math.round(actualGross - basic - hra - conveyance);

  const employerEsic = Math.round(actualGross * esicRate);
  const employeePf =
    typeof employeePfOverride === "number"
      ? Math.round(employeePfOverride)
      : Math.round(basic * pfPercent);
  const employeeEsic = Math.round(actualGross * esicRate);

  const grossPayable = basic + hra + conveyance + splAllowance; // equals actualGross
  const netPayable = Math.round(
    grossPayable - (employeePf + employeeEsic + ptFixed),
  );

  return {
    employerPf,
    employerEsic,
    actualGross,
    basicPay: basic,
    hra,
    conveyance,
    splAllowance,
    grossPayable,
    employeePf,
    employeeEsic,
    pt: ptFixed,
    netPayable,
  } as const;
}
