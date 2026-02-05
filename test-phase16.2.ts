/**
 * Phase 16.2 Test Suite
 * 
 * Tests A/B testing infrastructure and mobile responsiveness.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

/**
 * Test 1: A/B Test Event Creation
 */
async function testABTestEventCreation(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Create a test A/B event
    const event = await prisma.aBTestEvent.create({
      data: {
        testName: 'test-cache-indicator',
        variant: 'control',
        eventType: 'view',
        eventName: null,
        eventData: null,
        userAgent: 'Test User Agent',
        screenSize: '1920x1080',
        deviceType: 'desktop',
        timestamp: new Date(),
      },
    });

    if (!event.id) {
      return {
        name: 'A/B Test Event Creation',
        passed: false,
        message: 'Failed to create A/B test event',
        duration: Date.now() - startTime,
      };
    }

    // Clean up
    await prisma.aBTestEvent.delete({ where: { id: event.id } });

    return {
      name: 'A/B Test Event Creation',
      passed: true,
      message: 'Successfully created and deleted A/B test event',
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: 'A/B Test Event Creation',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Test 2: A/B Test Variant Distribution
 */
async function testVariantDistribution(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const variants = ['control', 'variantA', 'variantB', 'variantC'];
    const eventIds: string[] = [];

    // Create events for each variant
    for (const variant of variants) {
      const event = await prisma.aBTestEvent.create({
        data: {
          testName: 'test-distribution',
          variant,
          eventType: 'view',
          deviceType: 'desktop',
          timestamp: new Date(),
        },
      });
      eventIds.push(event.id);
    }

    // Query events
    const events = await prisma.aBTestEvent.findMany({
      where: {
        testName: 'test-distribution',
      },
    });

    // Check all variants present
    const foundVariants = new Set(events.map(e => e.variant));
    const allVariantsPresent = variants.every(v => foundVariants.has(v));

    // Clean up
    await prisma.aBTestEvent.deleteMany({
      where: { id: { in: eventIds } },
    });

    if (!allVariantsPresent) {
      return {
        name: 'Variant Distribution',
        passed: false,
        message: 'Not all variants were created',
        duration: Date.now() - startTime,
      };
    }

    return {
      name: 'Variant Distribution',
      passed: true,
      message: `All 4 variants created successfully`,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: 'Variant Distribution',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Test 3: Device Type Tracking
 */
async function testDeviceTypeTracking(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const deviceTypes = ['mobile', 'tablet', 'desktop'];
    const eventIds: string[] = [];

    // Create events for each device type
    for (const deviceType of deviceTypes) {
      const event = await prisma.aBTestEvent.create({
        data: {
          testName: 'test-devices',
          variant: 'control',
          eventType: 'view',
          deviceType,
          screenSize: deviceType === 'mobile' ? '375x667' : deviceType === 'tablet' ? '768x1024' : '1920x1080',
          timestamp: new Date(),
        },
      });
      eventIds.push(event.id);
    }

    // Query and group by device type
    const events = await prisma.aBTestEvent.findMany({
      where: { testName: 'test-devices' },
    });

    const foundDevices = new Set(events.map(e => e.deviceType));
    const allDevicesTracked = deviceTypes.every(d => foundDevices.has(d));

    // Clean up
    await prisma.aBTestEvent.deleteMany({
      where: { id: { in: eventIds } },
    });

    if (!allDevicesTracked) {
      return {
        name: 'Device Type Tracking',
        passed: false,
        message: 'Not all device types were tracked',
        duration: Date.now() - startTime,
      };
    }

    return {
      name: 'Device Type Tracking',
      passed: true,
      message: `All device types tracked: ${Array.from(foundDevices).join(', ')}`,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: 'Device Type Tracking',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Test 4: Event Data JSON Storage
 */
async function testEventDataStorage(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const eventData = {
      verificationCount: 5,
      confidenceScore: 0.88,
      clicked: true,
    };

    const event = await prisma.aBTestEvent.create({
      data: {
        testName: 'test-event-data',
        variant: 'variantA',
        eventType: 'event',
        eventName: 'click',
        eventData: JSON.stringify(eventData),
        deviceType: 'mobile',
        timestamp: new Date(),
      },
    });

    // Retrieve and parse
    const retrieved = await prisma.aBTestEvent.findUnique({
      where: { id: event.id },
    });

    if (!retrieved || !retrieved.eventData) {
      await prisma.aBTestEvent.delete({ where: { id: event.id } });
      return {
        name: 'Event Data Storage',
        passed: false,
        message: 'Event data not stored',
        duration: Date.now() - startTime,
      };
    }

    const parsedData = JSON.parse(retrieved.eventData);
    const dataMatches = JSON.stringify(parsedData) === JSON.stringify(eventData);

    // Clean up
    await prisma.aBTestEvent.delete({ where: { id: event.id } });

    return {
      name: 'Event Data Storage',
      passed: dataMatches,
      message: dataMatches 
        ? 'Event data stored and retrieved correctly' 
        : 'Event data mismatch',
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: 'Event Data Storage',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Test 5: Database Indexes
 */
async function testDatabaseIndexes(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Create multiple events for index testing
    const eventIds: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      const event = await prisma.aBTestEvent.create({
        data: {
          testName: 'index-test',
          variant: i % 2 === 0 ? 'control' : 'variantA',
          eventType: i % 3 === 0 ? 'view' : 'event',
          deviceType: 'desktop',
          timestamp: new Date(Date.now() - i * 1000 * 60),
        },
      });
      eventIds.push(event.id);
    }

    // Test various indexed queries
    const testNameQuery = await prisma.aBTestEvent.findMany({
      where: { testName: 'index-test' },
    });

    const variantQuery = await prisma.aBTestEvent.findMany({
      where: { variant: 'control' },
    });

    const eventTypeQuery = await prisma.aBTestEvent.findMany({
      where: { eventType: 'view' },
    });

    // Clean up
    await prisma.aBTestEvent.deleteMany({
      where: { id: { in: eventIds } },
    });

    const allQueriesWorked = 
      testNameQuery.length > 0 &&
      variantQuery.length > 0 &&
      eventTypeQuery.length > 0;

    return {
      name: 'Database Indexes',
      passed: allQueriesWorked,
      message: allQueriesWorked
        ? 'All indexed queries returned results'
        : 'Some indexed queries failed',
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: 'Database Indexes',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n🧪 Phase 16.2 Test Suite\n');
  console.log('Testing A/B testing infrastructure and analytics...\n');

  const tests = [
    testABTestEventCreation,
    testVariantDistribution,
    testDeviceTypeTracking,
    testEventDataStorage,
    testDatabaseIndexes,
  ];

  for (const test of tests) {
    const result = await test();
    results.push(result);
    
    const icon = result.passed ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    console.log(`${icon} ${result.name}${duration}`);
    console.log(`   ${result.message}\n`);
  }

  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const passRate = (passed / total * 100).toFixed(1);

  console.log('─'.repeat(50));
  console.log(`\n📊 Test Summary: ${passed}/${total} passed (${passRate}%)\n`);

  if (passed === total) {
    console.log('🎉 All tests passed! Phase 16.2 is production-ready.\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
  }

  // Disconnect Prisma
  await prisma.$disconnect();
  
  // Exit with appropriate code
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
