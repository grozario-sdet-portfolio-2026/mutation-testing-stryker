import { runDailySettlement } from '../../src/settlement';
import { DailySettlementProcessor } from '../../src/processor';
import { DailySettlement, TransactionType, TransactionStatus } from '../../src/models';
import sampleData from '../../data/sample-transactions.json';

// Mock the processor module
jest.mock('../../src/processor');

describe('settlement.ts', () => {
  let consoleLogSpy: jest.SpyInstance;
  let mockProcessor: jest.Mocked<DailySettlementProcessor>;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    mockProcessor = {
      process: jest.fn()
    } as any;
    (DailySettlementProcessor as jest.MockedClass<typeof DailySettlementProcessor>).mockImplementation(() => mockProcessor);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('runDailySettlement', () => {
    it('should process transactions and log header', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith('='.repeat(80));
      expect(consoleLogSpy).toHaveBeenCalledWith('DAILY SETTLEMENT PROCESSOR');
    });

    it('should log the number of input transactions', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('📥 Entrada:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('transações'));
    });

    it('should log transaction types with counts', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith('\nTipos de transações:');
      // Verify that transaction type counts are logged
      const logCalls = consoleLogSpy.mock.calls;
      const hasTypeLog = logCalls.some(call => 
        call[0]?.includes('   - ') && call[0]?.includes(':')
      );
      expect(hasTypeLog).toBe(true);
      
      // Verify counts are correctly incremented (not decremented or unchanged)
      const typeLogCalls = logCalls.filter(call => 
        call[0]?.includes('   - ') && call[0]?.includes(':')
      );
      expect(typeLogCalls.length).toBeGreaterThan(0);
      // Each type should have a count > 0
      typeLogCalls.forEach(call => {
        const match = call[0].match(/: (\d+)/);
        if (match) {
          const count = parseInt(match[1]);
          expect(count).toBeGreaterThan(0);
        }
      });
      
      // Verify that types.get returns correct value or 0 (not true/false/undefined)
      // by checking that all counts are valid numbers
      typeLogCalls.forEach(call => {
        const match = call[0].match(/: (\d+)/);
        expect(match).toBeTruthy();
        expect(match![1]).toMatch(/^\d+$/);
      });
    });

    it('should log processing message', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith('\n⏳ Processando...');
    });

    it('should log the number of output settlements', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Saída:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('merchant(s) consolidado(s)'));
    });

    it('should log consolidation section header', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith('CONSOLIDAÇÃO POR MERCHANT');
    });

    it('should log settlement details for each merchant', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'LOW'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('📊 Merchant: M001'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Gross Amount:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$1000.00'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total Fees:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$50.00'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total Refunds:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$100.00'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total Chargebacks:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$30.00'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total Penalties:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$20.00'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Net Amount:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$800.00'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Risk Level:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('LOW'));
    });

    it('should log settlement details for multiple merchants', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'LOW'
        },
        {
          merchantId: 'M002',
          grossAmount: 2000,
          totalFees: 100,
          totalRefunds: 200,
          totalChargebacks: 60,
          totalPenalties: 40,
          netAmount: 1600,
          riskLevel: 'MEDIUM'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('📊 Merchant: M001'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('📊 Merchant: M002'));
    });

    it('should log final summary section header', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith('RESUMO FINAL');
    });

    it('should log total merchants count', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'LOW'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total Merchants:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('1'));
    });

    it('should log correct financial summary totals', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'LOW'
        },
        {
          merchantId: 'M002',
          grossAmount: 2000,
          totalFees: 100,
          totalRefunds: 200,
          totalChargebacks: 60,
          totalPenalties: 40,
          netAmount: 1600,
          riskLevel: 'MEDIUM'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Financial Summary:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total Gross Amount:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$3000.00'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total Fees:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$150.00'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total Refunds:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$300.00'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total Chargebacks:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$90.00'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total Penalties:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$60.00'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total Net Amount:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$2400.00'));
    });

    it('should log risk distribution with HIGH risk merchants', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'HIGH'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Risk Distribution:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('HIGH Risk:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('1'));
    });

    it('should log risk distribution with MEDIUM risk merchants', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'MEDIUM'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('MEDIUM Risk:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('1'));
    });

    it('should log risk distribution with LOW risk merchants', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'LOW'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('LOW Risk:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('1'));
    });

    it('should log risk distribution with mixed risk levels', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'HIGH'
        },
        {
          merchantId: 'M002',
          grossAmount: 2000,
          totalFees: 100,
          totalRefunds: 200,
          totalChargebacks: 60,
          totalPenalties: 40,
          netAmount: 1600,
          riskLevel: 'MEDIUM'
        },
        {
          merchantId: 'M003',
          grossAmount: 3000,
          totalFees: 150,
          totalRefunds: 300,
          totalChargebacks: 90,
          totalPenalties: 60,
          netAmount: 2400,
          riskLevel: 'LOW'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('HIGH Risk:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('MEDIUM Risk:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('LOW Risk:'));
    });

    it('should correctly convert transaction dates', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const processCall = mockProcessor.process.mock.calls[0][0];
      expect(processCall.length).toBeGreaterThan(0);
      expect(processCall[0].createdAt).toBeInstanceOf(Date);
    });

    it('should preserve all transaction properties during conversion', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const processCall = mockProcessor.process.mock.calls[0][0];
      const firstTransaction = processCall[0];
      expect(firstTransaction).toHaveProperty('id');
      expect(firstTransaction).toHaveProperty('merchantId');
      expect(firstTransaction).toHaveProperty('type');
      expect(firstTransaction).toHaveProperty('amount');
      expect(firstTransaction).toHaveProperty('status');
      expect(firstTransaction).toHaveProperty('createdAt');
    });

    it('should handle empty settlements array', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Saída: 0'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total Merchants:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('0'));
    });

    it('should calculate totals correctly with zero values', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 0,
          totalFees: 0,
          totalRefunds: 0,
          totalChargebacks: 0,
          totalPenalties: 0,
          netAmount: 0,
          riskLevel: 'LOW'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$0.00'));
    });

    it('should format decimal amounts correctly', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1234.56,
          totalFees: 78.90,
          totalRefunds: 100.11,
          totalChargebacks: 50.55,
          totalPenalties: 25.25,
          netAmount: 979.75,
          riskLevel: 'LOW'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$1234.56'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$78.90'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$100.11'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$50.55'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$25.25'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$979.75'));
    });

    it('should log separator lines', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'LOW'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('-'.repeat(50)));
    });

    it('should count risk levels correctly when all are same level', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'LOW'
        },
        {
          merchantId: 'M002',
          grossAmount: 2000,
          totalFees: 100,
          totalRefunds: 200,
          totalChargebacks: 60,
          totalPenalties: 40,
          netAmount: 1600,
          riskLevel: 'LOW'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      const lowRiskLog = logCalls.find(call => call[0]?.includes('LOW Risk:'));
      expect(lowRiskLog).toBeDefined();
      expect(lowRiskLog![0]).toContain('2');
    });

    it('should handle large numbers of transactions', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const processCall = mockProcessor.process.mock.calls[0][0];
      expect(processCall.length).toBe(sampleData.transactions.length);
    });

    it('should create new DailySettlementProcessor instance', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      expect(DailySettlementProcessor).toHaveBeenCalled();
    });

    it('should call processor.process with converted transactions', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      expect(mockProcessor.process).toHaveBeenCalledTimes(1);
      expect(mockProcessor.process).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should handle multiple HIGH risk merchants in summary', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'HIGH'
        },
        {
          merchantId: 'M002',
          grossAmount: 2000,
          totalFees: 100,
          totalRefunds: 200,
          totalChargebacks: 60,
          totalPenalties: 40,
          netAmount: 1600,
          riskLevel: 'HIGH'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      const highRiskLog = logCalls.find(call => call[0]?.includes('HIGH Risk:'));
      expect(highRiskLog).toBeDefined();
      expect(highRiskLog![0]).toContain('2');
    });

    it('should handle multiple MEDIUM risk merchants in summary', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'MEDIUM'
        },
        {
          merchantId: 'M002',
          grossAmount: 2000,
          totalFees: 100,
          totalRefunds: 200,
          totalChargebacks: 60,
          totalPenalties: 40,
          netAmount: 1600,
          riskLevel: 'MEDIUM'
        },
        {
          merchantId: 'M003',
          grossAmount: 3000,
          totalFees: 150,
          totalRefunds: 300,
          totalChargebacks: 90,
          totalPenalties: 60,
          netAmount: 2400,
          riskLevel: 'MEDIUM'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      const mediumRiskLog = logCalls.find(call => call[0]?.includes('MEDIUM Risk:'));
      expect(mediumRiskLog).toBeDefined();
      expect(mediumRiskLog![0]).toContain('3');
    });
  });

  describe('string literal mutations', () => {
    it('should log exact separator line with equals signs', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const equalsSeparator = '='.repeat(80);
      expect(consoleLogSpy).toHaveBeenCalledWith(equalsSeparator);
    });

    it('should log exact separator line with dashes in merchant details', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'LOW'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      const dashSeparator = '   ' + '-'.repeat(50);
      expect(consoleLogSpy).toHaveBeenCalledWith(dashSeparator);
    });

    it('should log exact newline-prefixed sections', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith('\n' + '='.repeat(80));
    });

    it('should log exact input section with emoji', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      const inputLog = logCalls.find(call => call[0]?.startsWith('\n📥 Entrada:'));
      expect(inputLog).toBeDefined();
      expect(inputLog![0]).toMatch(/\n📥 Entrada: \d+ transações/);
    });

    it('should log exact output section with emoji', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      const outputLog = logCalls.find(call => call[0]?.startsWith('\n✅ Saída:'));
      expect(outputLog).toBeDefined();
      expect(outputLog![0]).toMatch(/\n✅ Saída: \d+ merchant\(s\) consolidado\(s\)/);
    });

    it('should log exact processing message with emoji', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith('\n⏳ Processando...');
    });

    it('should log exact merchant emoji prefix', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'LOW'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith('\n📊 Merchant: M001');
    });

    it('should log exact field labels with whitespace', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1234.56,
          totalFees: 78.90,
          totalRefunds: 100.11,
          totalChargebacks: 50.55,
          totalPenalties: 25.25,
          netAmount: 979.75,
          riskLevel: 'LOW'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith('   Gross Amount:        $1234.56');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Total Fees:          $78.90');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Total Refunds:       $100.11');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Total Chargebacks:   $50.55');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Total Penalties:     $25.25');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Net Amount:          $979.75');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Risk Level:          LOW');
    });

    it('should log newline prefix for summary sections', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      expect(consoleLogSpy).toHaveBeenCalledWith('\nTotal Merchants:         0');
      expect(consoleLogSpy).toHaveBeenCalledWith('\nFinancial Summary:');
      expect(consoleLogSpy).toHaveBeenCalledWith('\nRisk Distribution:');
    });

    it('should verify total penalties calculation is addition', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'LOW'
        },
        {
          merchantId: 'M002',
          grossAmount: 2000,
          totalFees: 100,
          totalRefunds: 200,
          totalChargebacks: 60,
          totalPenalties: 40,
          netAmount: 1600,
          riskLevel: 'MEDIUM'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      // Total penalties should be 20 + 40 = 60, not 20 - 40 = -20
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('$60.00'));
      const logCalls = consoleLogSpy.mock.calls;
      const penaltiesLog = logCalls.find(call => 
        call[0]?.includes('Total Penalties:') && call[0]?.includes('$60.00')
      );
      expect(penaltiesLog).toBeDefined();
    });

    it('should filter HIGH risk merchants correctly', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'HIGH'
        },
        {
          merchantId: 'M002',
          grossAmount: 2000,
          totalFees: 100,
          totalRefunds: 200,
          totalChargebacks: 60,
          totalPenalties: 40,
          netAmount: 1600,
          riskLevel: 'LOW'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      // Should count only HIGH risk merchants (1), not all settlements (2)
      const logCalls = consoleLogSpy.mock.calls;
      const highRiskLog = logCalls.find(call => call[0]?.includes('HIGH Risk:'));
      expect(highRiskLog).toBeDefined();
      expect(highRiskLog![0]).toContain('1');
      expect(highRiskLog![0]).not.toContain('2');
    });

    it('should filter MEDIUM risk merchants correctly', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'MEDIUM'
        },
        {
          merchantId: 'M002',
          grossAmount: 2000,
          totalFees: 100,
          totalRefunds: 200,
          totalChargebacks: 60,
          totalPenalties: 40,
          netAmount: 1600,
          riskLevel: 'HIGH'
        },
        {
          merchantId: 'M003',
          grossAmount: 3000,
          totalFees: 150,
          totalRefunds: 300,
          totalChargebacks: 90,
          totalPenalties: 60,
          netAmount: 2400,
          riskLevel: 'LOW'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      // Should count only MEDIUM risk merchants (1), not all settlements (3)
      const logCalls = consoleLogSpy.mock.calls;
      const mediumRiskLog = logCalls.find(call => call[0]?.includes('MEDIUM Risk:'));
      expect(mediumRiskLog).toBeDefined();
      expect(mediumRiskLog![0]).toContain('1');
      expect(mediumRiskLog![0]).not.toContain('3');
    });

    it('should filter LOW risk merchants correctly', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'LOW'
        },
        {
          merchantId: 'M002',
          grossAmount: 2000,
          totalFees: 100,
          totalRefunds: 200,
          totalChargebacks: 60,
          totalPenalties: 40,
          netAmount: 1600,
          riskLevel: 'HIGH'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      // Should count only LOW risk merchants (1), not all settlements (2)
      const logCalls = consoleLogSpy.mock.calls;
      const lowRiskLog = logCalls.find(call => call[0]?.includes('LOW Risk:'));
      expect(lowRiskLog).toBeDefined();
      expect(lowRiskLog![0]).toContain('1');
      expect(lowRiskLog![0]).not.toContain('2');
    });

    it('should verify risk filtering returns correct count when 0', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'LOW'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      const highRiskLog = logCalls.find(call => call[0]?.includes('HIGH Risk:'));
      expect(highRiskLog).toBeDefined();
      expect(highRiskLog![0]).toContain('0');
      
      const mediumRiskLog = logCalls.find(call => call[0]?.includes('MEDIUM Risk:'));
      expect(mediumRiskLog).toBeDefined();
      expect(mediumRiskLog![0]).toContain('0');
    });

    it('should count transaction types correctly using Map', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      const typeLogCalls = logCalls.filter(call => 
        call[0]?.includes('   - ') && call[0]?.includes(':')
      );
      
      // Verify we have transaction type logs
      expect(typeLogCalls.length).toBeGreaterThan(0);
      
      // Each log should show a positive count (verifies += 1, not -= 1)
      typeLogCalls.forEach(call => {
        const match = call[0].match(/: (\d+)/);
        if (match) {
          const count = parseInt(match[1]);
          // Count should be positive (verifies addition, not subtraction)
          expect(count).toBeGreaterThanOrEqual(1);
        }
      });
    });

    it('should use logical OR correctly for default value in type counting', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      const typeLogCalls = logCalls.filter(call => 
        call[0]?.includes('   - ') && call[0]?.includes(':')
      );
      
      // Verify counts are numeric (not boolean true/false from logical operators)
      typeLogCalls.forEach(call => {
        const match = call[0].match(/: (\d+)/);
        expect(match).toBeTruthy();
        const count = parseInt(match![1]);
        // Should be a valid number, not NaN (which would happen if it was true/false)
        expect(isNaN(count)).toBe(false);
        // Should be a realistic count, not 0 or 1 from boolean conversion
        expect(count).toBeGreaterThanOrEqual(1);
      });
    });

    it('should iterate through all transaction types in forEach', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      const typeLogCalls = logCalls.filter(call => 
        call[0]?.includes('   - ') && call[0]?.includes(':')
      );
      
      // Should have multiple transaction types from sample data
      expect(typeLogCalls.length).toBeGreaterThan(1);
      
      // Extract all types
      const types = typeLogCalls.map(call => {
        const match = call[0].match(/   - ([^:]+):/);
        return match ? match[1] : null;
      }).filter(t => t !== null);
      
      // Should have unique types
      const uniqueTypes = new Set(types);
      expect(uniqueTypes.size).toBe(types.length);
    });

    it('should count payment transactions correctly (not using subtraction)', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      const paymentLog = logCalls.find(call => call[0]?.includes('   - payment:'));
      
      expect(paymentLog).toBeDefined();
      const match = paymentLog![0].match(/: (\d+)/);
      expect(match).toBeTruthy();
      const count = parseInt(match![1]);
      
      // Should be 35 (from sample data), not negative or incorrect
      expect(count).toBe(35);
    });

    it('should count refund transactions correctly', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      const refundLog = logCalls.find(call => call[0]?.includes('   - refund:'));
      
      expect(refundLog).toBeDefined();
      const match = refundLog![0].match(/: (\d+)/);
      expect(match).toBeTruthy();
      const count = parseInt(match![1]);
      
      // Should be 8 (from sample data)
      expect(count).toBe(8);
    });

    it('should count chargeback transactions correctly', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      const chargebackLog = logCalls.find(call => call[0]?.includes('   - chargeback:'));
      
      expect(chargebackLog).toBeDefined();
      const match = chargebackLog![0].match(/: (\d+)/);
      expect(match).toBeTruthy();
      const count = parseInt(match![1]);
      
      // Should be 8 (from sample data)
      expect(count).toBe(8);
    });

    it('should count chargebackReversed transactions correctly', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      const chargebackReversedLog = logCalls.find(call => call[0]?.includes('   - chargebackReversed:'));
      
      expect(chargebackReversedLog).toBeDefined();
      const match = chargebackReversedLog![0].match(/: (\d+)/);
      expect(match).toBeTruthy();
      const count = parseInt(match![1]);
      
      // Should be 2 (from sample data)
      expect(count).toBe(2);
    });

    it('should use Map.set correctly to update counts', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      const typeLogCalls = logCalls.filter(call => 
        call[0]?.includes('   - ') && call[0]?.includes(':')
      );
      
      // Total count should be 35 + 8 + 8 + 2 = 53 if summed correctly
      let totalCount = 0;
      typeLogCalls.forEach(call => {
        const match = call[0].match(/: (\d+)/);
        if (match) {
          totalCount += parseInt(match[1]);
        }
      });
      
      expect(totalCount).toBe(53); // Total transactions in sample data
    });

    it('should handle Map.get with || operator correctly (not && operator)', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      const typeLogCalls = logCalls.filter(call => 
        call[0]?.includes('   - ') && call[0]?.includes(':')
      );
      
      // All counts should be valid positive integers
      // If && was used instead of ||, we'd get 0 for all
      typeLogCalls.forEach(call => {
        const match = call[0].match(/: (\d+)/);
        expect(match).toBeTruthy();
        const count = parseInt(match![1]);
        expect(count).toBeGreaterThan(0);
        expect(typeof count).toBe('number');
        expect(isNaN(count)).toBe(false);
      });
    });

    it('should use equals sign character in separator lines', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      
      // All equals separators should be exactly 80 equals signs
      const equalsSeparators = logCalls.filter(call => 
        call[0] === '='.repeat(80)
      );
      expect(equalsSeparators.length).toBeGreaterThan(0);
      
      // Verify they are made of '=' characters, not empty strings
      equalsSeparators.forEach(call => {
        expect(call[0]).toBe('================================================================================');
        expect(call[0].length).toBe(80);
        expect(call[0].split('').every((c: string) => c === '=')).toBe(true);
      });
    });

    it('should use newline character at start of composite separator lines', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      
      // Find lines that start with newline followed by equals
      const newlineSeparators = logCalls.filter(call => 
        typeof call[0] === 'string' && call[0].startsWith('\n') && call[0].includes('=')
      );
      
      expect(newlineSeparators.length).toBeGreaterThan(0);
      
      // Verify they start with actual newline character
      newlineSeparators.forEach(call => {
        expect(call[0].charAt(0)).toBe('\n');
        expect(call[0]).toMatch(/^\n=/);
      });
    });

    it('should use equals character in composite separator lines', () => {
      const settlements: DailySettlement[] = [
        {
          merchantId: 'M001',
          grossAmount: 1000,
          totalFees: 50,
          totalRefunds: 100,
          totalChargebacks: 30,
          totalPenalties: 20,
          netAmount: 800,
          riskLevel: 'LOW'
        }
      ];
      mockProcessor.process.mockReturnValue(settlements);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      
      // Find the composite separator lines ('\n' + '='.repeat(80))
      const compositeSeparators = logCalls.filter(call => 
        typeof call[0] === 'string' && 
        call[0].startsWith('\n') && 
        call[0].length === 81 &&
        call[0].substring(1).split('').every(c => c === '=')
      );
      
      expect(compositeSeparators.length).toBeGreaterThan(0);
      
      // Verify the equals part uses '=' character
      compositeSeparators.forEach(call => {
        const withoutNewline = call[0].substring(1);
        expect(withoutNewline).toBe('='.repeat(80));
        expect(withoutNewline.length).toBe(80);
      });
    });

    it('should verify all header separators use equals character', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const firstThreeCalls = consoleLogSpy.mock.calls.slice(0, 3);
      
      // First call should be '='.repeat(80)
      expect(firstThreeCalls[0][0]).toBe('='.repeat(80));
      expect(firstThreeCalls[0][0].split('').every((c: string) => c === '=')).toBe(true);
      
      // Third call should be '='.repeat(80)
      expect(firstThreeCalls[2][0]).toBe('='.repeat(80));
      expect(firstThreeCalls[2][0].split('').every((c: string) => c === '=')).toBe(true);
    });

    it('should verify consolidation section separators use equals character', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      
      // Find the consolidation section
      const consolidationIndex = logCalls.findIndex(call => 
        call[0] === 'CONSOLIDAÇÃO POR MERCHANT'
      );
      
      expect(consolidationIndex).toBeGreaterThan(-1);
      
      // The line before should be '\n' + '='.repeat(80)
      const lineBefore = logCalls[consolidationIndex - 1][0];
      expect(lineBefore).toBe('\n' + '='.repeat(80));
      expect(lineBefore.substring(1).split('').every((c: string) => c === '=')).toBe(true);
      
      // The line after should be '='.repeat(80)
      const lineAfter = logCalls[consolidationIndex + 1][0];
      expect(lineAfter).toBe('='.repeat(80));
      expect(lineAfter.split('').every((c: string) => c === '=')).toBe(true);
    });

    it('should verify summary section separators use equals character', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      
      // Find the summary section
      const summaryIndex = logCalls.findIndex(call => 
        call[0] === 'RESUMO FINAL'
      );
      
      expect(summaryIndex).toBeGreaterThan(-1);
      
      // The line before should be '\n' + '='.repeat(80)
      const lineBefore = logCalls[summaryIndex - 1][0];
      expect(lineBefore).toBe('\n' + '='.repeat(80));
      expect(lineBefore.charAt(0)).toBe('\n');
      expect(lineBefore.substring(1).split('').every((c: string) => c === '=')).toBe(true);
      
      // The line after should be '='.repeat(80)
      const lineAfter = logCalls[summaryIndex + 1][0];
      expect(lineAfter).toBe('='.repeat(80));
      expect(lineAfter.split('').every((c: string) => c === '=')).toBe(true);
    });

    it('should verify final separator uses newline and equals character', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      
      // The last log should be '\n' + '='.repeat(80)
      const lastLog = logCalls[logCalls.length - 1][0];
      expect(lastLog).toBe('\n' + '='.repeat(80));
      expect(lastLog.charAt(0)).toBe('\n');
      expect(lastLog.substring(1)).toBe('='.repeat(80));
      expect(lastLog.substring(1).split('').every((c: string) => c === '=')).toBe(true);
    });

    it('should verify newlines are literal newline characters not empty strings', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      
      // Find all strings that should start with newline
      const newlineStrings = logCalls.filter(call => 
        typeof call[0] === 'string' && call[0].charAt(0) === '\n'
      );
      
      expect(newlineStrings.length).toBeGreaterThan(0);
      
      // Verify they actually start with \n character (ASCII 10), not empty string
      newlineStrings.forEach(call => {
        expect(call[0].charCodeAt(0)).toBe(10); // \n is ASCII 10
        expect(call[0].charAt(0)).not.toBe('');
      });
    });

    it('should verify separator characters are not empty when repeated', () => {
      mockProcessor.process.mockReturnValue([]);

      runDailySettlement();

      const logCalls = consoleLogSpy.mock.calls;
      
      // Find all separator lines
      const separators = logCalls.filter(call => 
        typeof call[0] === 'string' && 
        (call[0] === '='.repeat(80) || call[0] === '\n' + '='.repeat(80))
      );
      
      expect(separators.length).toBeGreaterThan(0);
      
      // None should be empty or just newline
      separators.forEach(call => {
        expect(call[0]).not.toBe('');
        expect(call[0]).not.toBe('\n');
        expect(call[0].length).toBeGreaterThan(1);
      });
    });
  });

  describe('module entry point', () => {
    it('should export runDailySettlement function', () => {
      // Verify the function is properly exported and can be called
      expect(typeof runDailySettlement).toBe('function');
      expect(runDailySettlement).toBeDefined();
      expect(runDailySettlement.name).toBe('runDailySettlement');
    });

    it('should have runDailySettlement as a named export', () => {
      // This indirectly tests that the entry point code exists and is reachable
      const settlementModule = require('../../src/settlement');
      expect(settlementModule.runDailySettlement).toBeDefined();
      expect(typeof settlementModule.runDailySettlement).toBe('function');
    });
  });
});
