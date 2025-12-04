// Credit Adjustment and Transfer of Credit types
export type CreditAdjustmentDetailDto = {
    id: number;
    date: string;
    description: string;
    amount: number;
    insWriteoff: number;
    patientBalance: number;
    insuranceBalance: number;
    previousTotalBalance: number;
    adjustmentAmount: number;
    lines: Array<{
        code: string;
        treatment: string;
        provider: string;
        insWriteoff: number;
        ptPortion: number;
        inPortion: number;
        totalCharge: number;
        adjustment: number;
    }>;
};

export type TransferOfCreditDetailDto = {
    id: number;
    date: string;
    description: string;
    amount: number;
    lines: Array<{
        code: string;
        treatment: string;
        insWriteoff: number;
        ptPortion: number;
        inPortion: number;
        totalCharge: number;
    }>;
};
