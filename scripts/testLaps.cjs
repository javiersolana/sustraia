const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

// Load env vars
require('dotenv').config();

async function refreshAndTestLaps() {
    try {
        console.log('STRAVA_CLIENT_ID:', process.env.STRAVA_CLIENT_ID ? 'present' : 'MISSING');
        console.log('STRAVA_CLIENT_SECRET:', process.env.STRAVA_CLIENT_SECRET ? 'present' : 'MISSING');

        // Get user token
        const stravaToken = await prisma.stravaToken.findFirst();
        if (!stravaToken) {
            console.log('No Strava token found');
            await prisma.$disconnect();
            return;
        }

        console.log('\nCurrent token info:');
        console.log('  User ID:', stravaToken.userId);
        console.log('  Athlete ID:', stravaToken.athleteId);

        // Refresh the token
        console.log('\nRefreshing token with Strava API...');

        const refreshResponse = await axios.post('https://www.strava.com/oauth/token', {
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            refresh_token: stravaToken.refreshToken,
            grant_type: 'refresh_token'
        });

        const newTokenData = refreshResponse.data;
        console.log('Token refreshed successfully!');
        console.log('  Access token:', newTokenData.access_token.substring(0, 20) + '...');
        console.log('  Expires at:', new Date(newTokenData.expires_at * 1000).toISOString());

        // Update token in database - convert timestamp to Date
        await prisma.stravaToken.update({
            where: { id: stravaToken.id },
            data: {
                accessToken: newTokenData.access_token,
                refreshToken: newTokenData.refresh_token,
                expiresAt: new Date(newTokenData.expires_at * 1000),
            }
        });
        console.log('Token updated in database!\n');

        // Now test with the new token
        const workouts = await prisma.completedWorkout.findMany({
            where: { stravaId: { not: null } },
            orderBy: { completedAt: 'desc' },
            take: 5,
            select: { stravaId: true, title: true, actualDistance: true }
        });

        console.log('='.repeat(60));
        console.log('TESTING STRAVA LAPS API');
        console.log('='.repeat(60));

        for (const workout of workouts) {
            console.log(`\n📍 ${workout.title} (ID: ${workout.stravaId})`);

            try {
                const response = await axios.get(
                    `https://www.strava.com/api/v3/activities/${workout.stravaId}/laps`,
                    { headers: { Authorization: `Bearer ${newTokenData.access_token}` } }
                );

                const laps = response.data;
                console.log(`   Found ${laps.length} laps:`);
                laps.forEach((lap, i) => {
                    const distKm = (lap.distance / 1000).toFixed(3);
                    const paceSecsPerKm = lap.distance > 0 ? (lap.elapsed_time / lap.distance) * 1000 : 0;
                    const paceMin = Math.floor(paceSecsPerKm / 60);
                    const paceSec = Math.round(paceSecsPerKm % 60);
                    const timeMin = Math.floor(lap.elapsed_time / 60);
                    const timeSec = lap.elapsed_time % 60;
                    console.log(`     ${i + 1}. ${distKm}km | ${timeMin}:${timeSec.toString().padStart(2, '0')} | ` +
                        `Pace: ${paceMin}:${paceSec.toString().padStart(2, '0')}/km | "${lap.name}"`);
                });

                // Analyze lap types
                const distances = laps.map(l => l.distance);
                if (distances.length <= 1) {
                    console.log(`   ⚠️ Only 1 lap (full activity)`);
                } else {
                    const isAutoLaps = distances.every(d => Math.abs(d - 1000) < 150);
                    const hasVariableLaps = distances.some(d => d < 600 || d > 1200);

                    if (isAutoLaps) {
                        console.log(`   📏 AUTO-LAPS (1km each) - 默 default Strava setting`);
                    } else if (hasVariableLaps) {
                        console.log(`   ✅ MANUAL LAPS - intervals/workout detected!`);
                        // Classify workout based on lap structure
                        const shortLaps = distances.filter(d => d < 600);
                        const mediumLaps = distances.filter(d => d >= 200 && d <= 600);
                        if (shortLaps.length >= 3) {
                            console.log(`   🏃 Classification: SERIES (${shortLaps.length} short laps)`);
                        }
                    } else {
                        console.log(`   📊 VARIABLE LAPS - mixed structure`);
                    }
                }

            } catch (err) {
                console.error(`   ❌ Error: ${err.response?.data?.message || err.message}`);
            }
        }

        await prisma.$disconnect();
    } catch (err) {
        console.error('Error:', err.response?.data || err.message);
        await prisma.$disconnect();
    }
}

refreshAndTestLaps();
