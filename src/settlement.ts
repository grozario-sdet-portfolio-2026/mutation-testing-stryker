

import { DailySettlementProcessor } from './processor';
import { Transaction } from './models';
import sampleData from '../data/sample-transactions.json';

function convertToTransactions(data: any[]): Transaction[] {
  return data.map(item => ({
    ...item,
    createdAt: new Date(item.createdAt)
  }));
}

export function runDailySettlement(): void {
  console.log('='.repeat(80));
  console.log('DAILY SETTLEMENT PROCESSOR');
  console.log('='.repeat(80));

  const processor = new DailySettlementProcessor();
  const transactions = convertToTransactions(sampleData.transactions);

  console.log(`\n📥 Entrada: ${transactions.length} transações`);
  console.log('\nTipos de transações:');
  const types = new Map<string, number>();
  transactions.forEach(t => {
    types.set(t.type, (types.get(t.type) || 0) + 1);
  });
  types.forEach((count, type) => {
    console.log(`   - ${type}: ${count}`);
  });

  console.log('\n⏳ Processando...');
  const settlements = processor.process(transactions);

  console.log(`\n✅ Saída: ${settlements.length} merchant(s) consolidado(s)`);
  console.log('\n' + '='.repeat(80));
  console.log('CONSOLIDAÇÃO POR MERCHANT');
  console.log('='.repeat(80));

  settlements.forEach(settlement => {
    console.log(`\n📊 Merchant: ${settlement.merchantId}`);
    console.log(`   Gross Amount:        $${settlement.grossAmount.toFixed(2)}`);
    console.log(`   Total Fees:          $${settlement.totalFees.toFixed(2)}`);
    console.log(`   Total Refunds:       $${settlement.totalRefunds.toFixed(2)}`);
    console.log(`   Total Chargebacks:   $${settlement.totalChargebacks.toFixed(2)}`);
    console.log(`   Total Penalties:     $${settlement.totalPenalties.toFixed(2)}`);
    console.log('   ' + '-'.repeat(50));
    console.log(`   Net Amount:          $${settlement.netAmount.toFixed(2)}`);
    console.log(`   Risk Level:          ${settlement.riskLevel}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('RESUMO FINAL');
  console.log('='.repeat(80));

  const totalGrossAmount = settlements.reduce((sum, s) => sum + s.grossAmount, 0);
  const totalNetAmount = settlements.reduce((sum, s) => sum + s.netAmount, 0);
  const totalFees = settlements.reduce((sum, s) => sum + s.totalFees, 0);
  const totalRefunds = settlements.reduce((sum, s) => sum + s.totalRefunds, 0);
  const totalChargebacks = settlements.reduce((sum, s) => sum + s.totalChargebacks, 0);
  const totalPenalties = settlements.reduce((sum, s) => sum + s.totalPenalties, 0);
  const highRiskMerchants = settlements.filter(s => s.riskLevel === 'HIGH').length;
  const mediumRiskMerchants = settlements.filter(s => s.riskLevel === 'MEDIUM').length;
  const lowRiskMerchants = settlements.filter(s => s.riskLevel === 'LOW').length;

  console.log(`\nTotal Merchants:         ${settlements.length}`);
  console.log(`\nFinancial Summary:`);
  console.log(`  Total Gross Amount:    $${totalGrossAmount.toFixed(2)}`);
  console.log(`  Total Fees:            $${totalFees.toFixed(2)}`);
  console.log(`  Total Refunds:         $${totalRefunds.toFixed(2)}`);
  console.log(`  Total Chargebacks:     $${totalChargebacks.toFixed(2)}`);
  console.log(`  Total Penalties:       $${totalPenalties.toFixed(2)}`);
  console.log(`  Total Net Amount:      $${totalNetAmount.toFixed(2)}`);
  
  console.log(`\nRisk Distribution:`);
  console.log(`  HIGH Risk:             ${highRiskMerchants}`);
  console.log(`  MEDIUM Risk:           ${mediumRiskMerchants}`);
  console.log(`  LOW Risk:              ${lowRiskMerchants}`);

  console.log('\n' + '='.repeat(80));
}

if (require.main === module) {
  runDailySettlement();
}
