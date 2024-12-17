import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const BASE_URL = 'http://localhost:3002/api/v1';
const TEST_PREFIX = 'k6-test';

const CONFIG = {
    PQC_GATEWAY: {
        deviceId: 'pqc-test-1',
        deviceName: 'PQC Gateway 1',
        signature: 'nxnOwFyDSZ0fLnbjjox41Rh632K4T2jho08Y6T6WOS5jJ6KXBLXBpu9lqv8Y3XA5STeaU+m55xsu8i9V46pDDg==',
        deviceType: 'pqc-gateway'
    },
    NETWORK_TYPES: ['ETHERNET', 'SATELLITE', 'MOBILE'],
    DEVICE_TYPES: ['laptop', 'mobile', 'tablet'],
    FLOW_CONTROL_LEVELS: ['low', 'medium', 'high'],
    ALARM_TYPES: ['INFO', 'WARNING', 'FAULT']
};

const TEST_SCENARIOS = {
    minimal: {
        deviceScenario: {
            executor: 'constant-vus',
            vus: 1,
            duration: '1m',
            gracefulStop: '10s'
        },
        pqcScenario: {
            executor: 'constant-vus',
            vus: 1,
            duration: '1m',
            gracefulStop: '10s'
        },
        queryScenario: {
            executor: 'constant-vus',
            vus: 1,
            duration: '1m',
            gracefulStop: '10s'
        }
    },
    moderate: {
        deviceScenario: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '1m', target: 10 },
                { duration: '3m', target: 10 },
                { duration: '1m', target: 0 }
            ],
            gracefulStop: '10s'
        },
        pqcScenario: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '1m', target: 3 },
                { duration: '3m', target: 3 },
                { duration: '1m', target: 0 }
            ],
            gracefulStop: '10s'
        },
        queryScenario: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '1m', target: 5 },
                { duration: '3m', target: 5 },
                { duration: '1m', target: 0 }
            ],
            gracefulStop: '10s'
        }
    },
    intensive: {
        deviceScenario: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 15 },
                { duration: '5m', target: 15 },
                { duration: '2m', target: 25 },
                { duration: '5m', target: 30 },
                { duration: '2m', target: 0 }
            ],
            gracefulStop: '10s'
        },
        pqcScenario: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 5 },
                { duration: '5m', target: 5 },
                { duration: '2m', target: 8 },
                { duration: '5m', target: 10 },
                { duration: '2m', target: 0 }
            ],
            gracefulStop: '10s'
        },
        queryScenario: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 10 },
                { duration: '5m', target: 10 },
                { duration: '2m', target: 15 },
                { duration: '5m', target: 25 },
                { duration: '2m', target: 0 }
            ],
            gracefulStop: '10s'
        }
    }
};

const THRESHOLDS = {
    minimal: {
        http_req_duration: ['p(95)<500', 'p(99)<1000'],
        http_req_failed: ['rate<0.01'],
        'http_req_duration{type:devices}': ['p(95)<400'],
        'http_req_duration{type:pqc}': ['p(95)<600'],
        'http_reqs': ['rate>1']
    },
    moderate: {
        http_req_duration: ['p(95)<1000', 'p(99)<1500'],
        http_req_failed: ['rate<0.01'],
        'http_req_duration{type:devices}': ['p(95)<1000'],
        'http_req_duration{type:pqc}': ['p(95)<1500'],
        'http_reqs': ['rate>10']
    },
    intensive: {
        http_req_duration: ['p(95)<2500', 'p(99)<5000'],
        http_req_failed: ['rate<0.02'],
        'http_req_duration{type:devices}': ['p(95)<2000'],
        'http_req_duration{type:pqc}': ['p(95)<4000'],
        'http_reqs': ['rate>20']
    }
};

const testDevices = new SharedArray('test devices', function () {
    return JSON.parse(open('./test-devices.json'));
});

const baseRequestConfig = {
    headers: { 'Content-Type': 'application/json' },
    timeout: '10s'
};

function generateNetworkInfo() {
    return {
        networkRoute: 'ETHERNET',
        uploadTraffic: '50 kbit/s',
        downloadTraffic: '500 kbit/s',
        networkInfo: [{
            Interface: 'WAN1',
            host: 'ETHERNET',
            ipAddr: '192.168.1.1'
        }]
    };
}

function generateDeviceInfo(deviceId) {
    return {
        deviceType: "laptop",
        deviceId: deviceId,
        loginUser: `user1`,
        host: `host-test`,
        ipAddr: `192.168.100.200`
    };
}

function generateTestData() {
    const deviceIndex = `${__VU}-${__ITER}`;
    const device = testDevices[__ITER % testDevices.length];
    const testDeviceId = `${TEST_PREFIX}-${deviceIndex}`;

    return {
        device: {
            deviceId: testDeviceId,
            publicKey: device.publicKey,
            deviceType: 'laptop',
            ipAddr: `192.168.100.200`,
            deviceName: `Test Device ${deviceIndex}`,
            flowControlLevel: 'medium'
        },
        pqcStatus: {
            signature: CONFIG.PQC_GATEWAY.signature,
            deviceId: CONFIG.PQC_GATEWAY.deviceId,
            deviceName: CONFIG.PQC_GATEWAY.deviceName,
            deviceType: CONFIG.PQC_GATEWAY.deviceType,
            networkInfo: generateNetworkInfo(),
            deviceInfo: [generateDeviceInfo(testDeviceId)]
        }
    };
}

function retryRequest(requestFn, maxRetries = 2) {
    let retries = 0;
    while (retries < maxRetries) {
        const response = requestFn();
        if (response.status < 400) {
            return response;
        }
        retries++;
        sleep(1);
    }
    return requestFn();
}

function deviceManagementFlow(testData) {
    group('Device Management Flow', () => {
        // Register
        const registerRes = retryRequest(() => http.post(
            `${BASE_URL}/devices/register`,
            JSON.stringify(testData.device),
            { ...baseRequestConfig, tags: { type: 'devices' } }
        ));

        check(registerRes, {
            'device registration successful': (r) => r.status === 201
        });

        if (registerRes.status !== 201) {
            console.log(`Registration failed: ${registerRes.status}`);
            return;
        }

        // Authenticate
        const authRes = retryRequest(() => http.post(
            `${BASE_URL}/devices/authenticate`,
            JSON.stringify({
                signature: testData.pqcStatus.signature,
                deviceId: testData.pqcStatus.deviceId,
                deviceType: testData.pqcStatus.deviceType
            }),
            { ...baseRequestConfig, tags: { type: 'devices' } }
        ));

        check(authRes, {
            'device authentication successful': (r) => r.status === 201
        });

        // Get device details
        const deviceRes = retryRequest(() => http.get(
            `${BASE_URL}/devices/${testData.device.deviceId}`,
            { tags: { type: 'devices' } }
        ));

        check(deviceRes, {
            'get device successful': (r) => r.status === 200
        });

        // Update device
        const updateRes = retryRequest(() => http.patch(
            `${BASE_URL}/devices/${testData.device.deviceId}`,
            JSON.stringify({
                deviceName: `Updated ${randomString(5)}`,
                flowControlLevel: CONFIG.FLOW_CONTROL_LEVELS[randomIntBetween(0, 2)]
            }),
            { ...baseRequestConfig, tags: { type: 'devices' } }
        ));

        check(updateRes, {
            'update device successful': (r) => r.status === 200
        });
    });
}

function pqcGatewayFlow(testData) {
    group('PQC Gateway Flow', () => {
        // Status update
        const statusRes = retryRequest(() => http.post(
            `${BASE_URL}/pqcGateway/status_ind`,
            JSON.stringify(testData.pqcStatus),
            { ...baseRequestConfig, tags: { type: 'pqc' } }
        ));

        check(statusRes, {
            'status update successful': (r) => r.status === 201,
            'response contains device control': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.deviceCtrl && Array.isArray(body.deviceCtrl);
                } catch (e) {
                    return false;
                }
            }
        });

        sleep(1);

        // Alarm indication
        const alarmRes = retryRequest(() => http.post(
            `${BASE_URL}/pqcGateway/alarm_ind`,
            JSON.stringify({
                ...testData.pqcStatus,
                alarmInfo: [{
                    alarmType: CONFIG.ALARM_TYPES[randomIntBetween(0, 2)],
                    alarmDescription: `Test alarm ${randomString(10)}`
                }]
            }),
            { ...baseRequestConfig, tags: { type: 'pqc' } }
        ));

        check(alarmRes, {
            'alarm update successful': (r) => r.status === 201
        });
    });
}

function queryOperations() {
    group('Query Operations', () => {
        // Device list queries
        const deviceQueries = [
            'page=1&limit=10',
            'page=1&limit=50&sortBy=createdAt&sortOrder=DESC',
            'page=2&limit=20&includePqcGateway=true'
        ];

        deviceQueries.forEach(params => {
            const listRes = http.get(
                `${BASE_URL}/devices/list?${params}`,
                { tags: { type: 'queries' } }
            );

            check(listRes, {
                'device list query successful': (r) => r.status === 200
            });
        });

        // Device statistics
        const statsRes = http.get(
            `${BASE_URL}/devices/statistics`,
            { tags: { type: 'queries' } }
        );

        check(statsRes, {
            'statistics query successful': (r) => r.status === 200
        });

        // Alarm queries
        const alarmQueries = [
            'page=1&limit=10',
            'page=1&limit=20&alarmType=WARNING',
            'sortBy=createdAt&sortOrder=DESC&alarmStatus=ACTIVE',
            'startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z'
        ];

        alarmQueries.forEach(params => {
            const alarmsRes = http.get(
                `${BASE_URL}/pqcGateway/alarms?${params}`,
                { tags: { type: 'queries' } }
            );

            check(alarmsRes, {
                'alarm list query successful': (r) => r.status === 200
            });
        });
    });
}

function cleanupTestDevices() {
    group('Cleanup Test Devices', () => {
        const listRes = http.get(
            `${BASE_URL}/devices/list?deviceId_like=${TEST_PREFIX}&page=1&limit=999999999999999999`,
            { tags: { type: 'cleanup' } }
        );

        if (listRes.status === 200) {
            try {
                const response = JSON.parse(listRes.body);
                const devices = response.data.devices;

                devices
                    .filter(device => device.deviceId.startsWith(TEST_PREFIX))
                    .forEach(device => {
                        const deleteRes = http.del(
                            `${BASE_URL}/devices/${device.deviceId}`,
                            null,
                            {
                                headers: { 'Content-Type': 'application/json' },
                                tags: { type: 'cleanup' }
                            }
                        );

                        check(deleteRes, {
                            'device cleanup successful': (r) => r.status === 200 || r.status === 204
                        });
                    });

                console.log('Test completed');
            } catch (error) {
                console.error('Error during cleanup:', error);
            }
        } else {
            console.error('Failed to fetch test devices for cleanup');
        }
    });
}

export const options = {
    scenarios: {
        devices: {
            ...TEST_SCENARIOS[__ENV.TYPE || 'minimal'].deviceScenario,
            exec: 'deviceScenario'
        },
        pqc: {
            ...TEST_SCENARIOS[__ENV.TYPE || 'minimal'].pqcScenario,
            exec: 'pqcScenario'
        },
        queries: {
            ...TEST_SCENARIOS[__ENV.TYPE || 'minimal'].queryScenario,
            exec: 'queryScenario'
        }
    },
    thresholds: THRESHOLDS[__ENV.TYPE || 'minimal']
};

export function deviceScenario() {
    const testData = generateTestData();
    deviceManagementFlow(testData);
    sleep(randomIntBetween(1, 2));
}

export function pqcScenario() {
    const testData = generateTestData();
    pqcGatewayFlow(testData);
    sleep(randomIntBetween(1, 2));
}

export function queryScenario() {
    queryOperations();
    sleep(randomIntBetween(1, 2));
}

export function teardown() {
    console.log('Starting cleanup process...');
    cleanupTestDevices();
}
