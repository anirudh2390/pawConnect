/**
 * PawConnect Module 6 – Test Data Setup Script
 * Creates Alice + Bob users (or uses existing), creates a pet listing,
 * an adoption request, a chat room, and seeds 3 messages (1 unread from Bob).
 */
const http = require('http');

function req(method, path, body, token) {
    return new Promise((resolve) => {
        const d = body ? JSON.stringify(body) : null;
        const opts = {
            hostname: 'localhost', port: 5000, path, method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
                ...(d ? { 'Content-Length': Buffer.byteLength(d) } : {})
            }
        };
        const r = http.request(opts, res => {
            let b = '';
            res.on('data', c => b += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(b) }); }
                catch { resolve({ status: res.statusCode, body: b }); }
            });
        });
        r.on('error', e => resolve({ status: 0, body: e.message }));
        if (d) r.write(d);
        r.end();
    });
}

async function registerOrLogin(name, email, password) {
    // Try login first
    const login = await req('POST', '/api/auth/login', { email, password });
    if (login.status === 200) {
        console.log(`✓ ${name} logged in: ${login.body.user.id}`);
        return login.body;
    }
    // Register
    const reg = await req('POST', '/api/auth/register', {
        name, email, password,
        location: { city: 'TestCity', state: 'TC' },
        phoneNumber: '5550000000'
    });
    if (reg.status === 201) {
        console.log(`✓ ${name} registered: ${reg.body.user.id}`);
        return reg.body;
    }
    console.error(`✗ ${name} register error ${reg.status}:`, reg.body);
    process.exit(1);
}

async function main() {
    const aliceAuth = await registerOrLogin('Alice Smith', 'alice@test.com', 'Test@1234');
    const bobAuth = await registerOrLogin('Bob Johnson', 'bob@test.com', 'Test@1234');

    const aliceToken = aliceAuth.token;
    const bobToken = bobAuth.token;
    const aliceId = aliceAuth.user.id;
    const bobId = bobAuth.user.id;

    // Check if room already exists
    const existingRooms = await req('GET', '/api/chats/rooms', null, aliceToken);
    if (existingRooms.body.rooms?.length > 0) {
        const r = existingRooms.body.rooms[0];
        console.log('\n✓ Existing room found:', r._id);
        console.log('  Other participant:', r.otherParticipant?.name);
        console.log('  Unread count:', r.unreadCount);
        console.log('  Last message:', r.lastMessage?.text);
        const unread = await req('GET', '/api/chats/unread-count', null, aliceToken);
        console.log('  Total unread:', unread.body.unreadCount);
        console.log('\n📌 Use these IDs in your browser test:');
        console.log('  ALICE_ID:', aliceId);
        console.log('  BOB_ID:', bobId);
        console.log('  ROOM_ID:', r._id);
        return;
    }

    // Find or create Bob's pet
    const bPets = await req('GET', '/api/pets', null, bobToken);
    let petId = bPets.body.pets?.find(p => p.listerId === bobId || p.lister?._id === bobId)?._id;

    if (!petId) {
        const petRes = await req('POST', '/api/pets', {
            name: 'Buddy', type: 'Dog', breed: 'Labrador',
            gender: 'Male', size: 'Medium',
            description: 'Friendly dog for Module 6 testing',
            location: { city: 'TestCity', state: 'TC' }
        }, bobToken);
        if (petRes.status !== 201) {
            console.error('Pet creation failed:', petRes.status, petRes.body);
            process.exit(1);
        }
        petId = petRes.body.pet._id;
        console.log('✓ Pet created:', petId);
    } else {
        console.log('✓ Using existing pet:', petId);
    }

    // Alice creates adoption request
    const adoptRes = await req('POST', '/api/adoptions', {
        petId, message: 'I would love to adopt Buddy for Module 6 testing!'
    }, aliceToken);
    if (adoptRes.status === 201) {
        console.log('✓ Adoption request created');
    } else {
        console.log('⚠ Adoption note:', adoptRes.body?.message || adoptRes.status);
    }

    // Create chat room
    const roomRes = await req('POST', '/api/chats/rooms', { otherUserId: bobId }, aliceToken);
    if (!roomRes.body.room?._id) {
        console.error('Room creation failed:', roomRes.status, roomRes.body);
        process.exit(1);
    }
    const roomId = roomRes.body.room._id;
    console.log('✓ Chat room created:', roomId);

    // Seed messages
    await req('POST', `/api/chats/rooms/${roomId}/messages`, { text: 'Hi Bob! Is Buddy still available?' }, aliceToken);
    await req('POST', `/api/chats/rooms/${roomId}/messages`, { text: 'Yes! Buddy is amazing and still looking for a home.' }, bobToken);
    console.log('✓ Seeded 2 messages');

    // Mark them as read for Alice (simulating Alice viewed the chat)
    await req('PATCH', `/api/chats/rooms/${roomId}/read`, null, aliceToken);
    console.log('✓ Alice marked messages as read');

    // Bob sends a NEW unread message (Alice hasn't opened chat since)
    await req('POST', `/api/chats/rooms/${roomId}/messages`, { text: 'When can you come visit Buddy? He is waiting! 🐾' }, bobToken);
    console.log('✓ Bob sent 1 unread message to Alice');

    // Final check
    const unreadCheck = await req('GET', '/api/chats/unread-count', null, aliceToken);
    console.log('✓ Alice unread count:', unreadCheck.body.unreadCount);

    const roomCheck = await req('GET', '/api/chats/rooms', null, aliceToken);
    const room = roomCheck.body.rooms?.[0];
    console.log('✓ Room in list:', !!room, '| Unread badge:', room?.unreadCount, '| Last msg:', room?.lastMessage?.text?.slice(0, 40));

    console.log('\n📌 Use these IDs in your browser test:');
    console.log('  ALICE_ID:', aliceId);
    console.log('  BOB_ID:', bobId);
    console.log('  ROOM_ID:', roomId);
    console.log('\n✅ Test data ready! Login to http://localhost:5173 as alice@test.com / Test@1234');
}

main().catch(console.error);
