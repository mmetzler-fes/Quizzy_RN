const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = function setupApi(app, userDataPath) {
	const dbPath = path.join(userDataPath, 'quizzy_database.json');
	console.log('Database path:', dbPath);

	function readDB() {
		if (!fs.existsSync(dbPath)) {
			const defaultDb = {
				quizzes: [
					{ id: 1, quizname: 'DB Grundbegriffe', query: 'Beziehung', answer: 'ist eine Verbindung zwischen zwei oder mehr Entitäten. Beispielsweise könnte es eine Beziehung zwischen den Entitäten Person und Unternehmen geben, wenn eine Person dort beschäftigt ist.' },
					{ id: 2, quizname: 'DB Grundbegriffe', query: 'Normalisierung', answer: 'der Prozess wird bei der Konzeption von Datenbanken verwendet, um Redundanzen und Inkonsistenzen in der Datenstruktur zu vermeiden.' },
					{ id: 3, quizname: 'DB Grundbegriffe', query: 'Tupel', answer: 'repräsentiert alle Merkmalswerte einer Entität einer Entitätsmenge.' },
					{ id: 4, quizname: 'DB Grundbegriffe', query: 'Primary Key', answer: 'ist ein Attribut, das jeder Entität in einer Datenbank eindeutig zugeordnet ist.' },
					{ id: 5, quizname: 'Netzwerke', query: 'IP-Adresse', answer: 'Eine eindeutige Adresse für ein Gerät in einem Netzwerk.' },
					{ id: 6, quizname: 'Netzwerke', query: 'Router', answer: 'Verbindet mehrere Netzwerke miteinander und leitet Datenpakete weiter.' }
				],
				vokabeln: [],
				results: [],
				selectedTopics: [],
				teacherTopics: [],
				examMode: false,
				admin: { username: 'admin', password: 'lehrer1' },
				initialized: true,
				nextQuizId: 10,
				nextVokabelId: 1,
				nextResultId: 1
			};
			writeDB(defaultDb);
			return defaultDb;
		}
		return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
	}

	function writeDB(data) {
		fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
	}

	app.get('/api/init', (req, res) => {
		readDB();
		res.json({ success: true });
	});

	app.get('/api/quizNames', (req, res) => {
		const db = readDB();
		const names = [...new Set(db.quizzes.map(i => i.quizname))];
		res.json(names.sort());
	});

	app.get('/api/quizByName/:name', (req, res) => {
		const db = readDB();
		res.json(db.quizzes.filter(i => i.quizname === req.params.name).sort((a, b) => a.id - b.id));
	});

	app.get('/api/quizAll', (req, res) => {
		const db = readDB();
		res.json(db.quizzes.sort((a, b) => {
			if (a.quizname !== b.quizname) return a.quizname.localeCompare(b.quizname);
			return a.id - b.id;
		}));
	});

	app.post('/api/quizItem', (req, res) => {
		const db = readDB();
		const { quizname, query, answer } = req.body;
		const newItem = { id: db.nextQuizId++, quizname, query, answer };
		db.quizzes.push(newItem);
		writeDB(db);
		res.json({ id: newItem.id });
	});

	app.delete('/api/quizItem/:id', (req, res) => {
		const db = readDB();
		db.quizzes = db.quizzes.filter(i => i.id !== parseInt(req.params.id));
		writeDB(db);
		res.json({ success: true });
	});

	app.put('/api/quizItem/:id', (req, res) => {
		const db = readDB();
		const { quizname, query, answer } = req.body;
		const index = db.quizzes.findIndex(i => i.id === parseInt(req.params.id));
		if (index !== -1) {
			db.quizzes[index] = { ...db.quizzes[index], quizname, query, answer };
			writeDB(db);
		}
		res.json({ success: true });
	});

	app.get('/api/selectedTopics', (req, res) => {
		const db = readDB();
		res.json({ selectedTopics: db.selectedTopics || [] });
	});

	app.put('/api/selectedTopics', (req, res) => {
		const db = readDB();
		db.selectedTopics = req.body.selectedTopics || [];
		writeDB(db);
		res.json({ success: true });
	});

	app.get('/api/teacherTopics', (req, res) => {
		const db = readDB();
		res.json({ teacherTopics: db.teacherTopics || [] });
	});

	app.put('/api/teacherTopics', (req, res) => {
		const db = readDB();
		db.teacherTopics = req.body.teacherTopics || [];
		writeDB(db);
		res.json({ success: true });
	});

	app.get('/api/examMode', (req, res) => {
		const db = readDB();
		res.json({ examMode: db.examMode || false });
	});

	app.put('/api/examMode', (req, res) => {
		const db = readDB();
		db.examMode = !!req.body.examMode;
		writeDB(db);
		res.json({ success: true });
	});


	app.delete('/api/quizByName/:name', (req, res) => {
		const db = readDB();
		db.quizzes = db.quizzes.filter(i => i.quizname !== req.params.name);
		writeDB(db);
		res.json({ success: true });
	});

	app.get('/api/vokabelnAll', (req, res) => {
		res.json(readDB().vokabeln.sort((a, b) => a.id - b.id));
	});

	app.post('/api/vokabel', (req, res) => {
		const db = readDB();
		const { name, vokabel, sprache } = req.body;
		const newItem = { id: db.nextVokabelId++, name, vokabel, sprache };
		db.vokabeln.push(newItem);
		writeDB(db);
		res.json({ id: newItem.id });
	});

	app.delete('/api/vokabel/:id', (req, res) => {
		const db = readDB();
		db.vokabeln = db.vokabeln.filter(i => i.id !== parseInt(req.params.id));
		writeDB(db);
		res.json({ success: true });
	});

	app.post('/api/verifyAdmin', (req, res) => {
		const db = readDB();
		const { username, password } = req.body;
		res.json((db.admin && db.admin.username === username && db.admin.password === password));
	});

	app.get('/api/adminCredentials', (req, res) => {
		res.json(readDB().admin || null);
	});

	app.put('/api/adminPassword', (req, res) => {
		const db = readDB();
		if (db.admin) {
			db.admin.password = req.body.newPassword;
			writeDB(db);
		}
		res.json({ success: true });
	});

	app.post('/api/quizResult', (req, res) => {
		const db = readDB();
		const { username, quizname, score, totalQuestions, details } = req.body;
		const newResult = {
			id: db.nextResultId++,
			username, quizname, score, totalQuestions,
			percentage: Math.round((score / totalQuestions) * 100),
			details,
			timestamp: new Date().toISOString()
		};
		db.results.push(newResult);
		writeDB(db);
		res.json({ id: newResult.id });
	});

	app.get('/api/quizResults', (req, res) => {
		res.json(readDB().results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
	});

	app.delete('/api/quizResult/:id', (req, res) => {
		const db = readDB();
		db.results = db.results.filter(r => r.id !== parseInt(req.params.id));
		writeDB(db);
		res.json({ success: true });
	});

	app.delete('/api/quizResultsAll', (req, res) => {
		const db = readDB();
		db.results = [];
		writeDB(db);
		res.json({ success: true });
	});

	app.get('/api/networkInfo', (req, res) => {
		const interfaces = os.networkInterfaces();
		const wifiNamePattern = /(wi-?fi|wlan|wireless|^wl|^en0$)/i;
		const isPrivateIPv4 = (ip) => {
			if (!ip || typeof ip !== 'string') return false;
			if (ip.startsWith('10.')) return true;
			if (ip.startsWith('192.168.')) return true;
			const parts = ip.split('.').map((p) => parseInt(p, 10));
			if (parts.length !== 4 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return false;
			return parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31;
		};

		const allExternalIps = Object.entries(interfaces)
			.flatMap(([, addresses]) =>
				(addresses || [])
					.filter((addr) => addr.family === 'IPv4' && !addr.internal)
					.map((addr) => addr.address)
			);

		const wifiIps = Object.entries(interfaces)
			.filter(([name]) => wifiNamePattern.test(name))
			.flatMap(([, addresses]) =>
				(addresses || [])
					.filter((addr) => addr.family === 'IPv4' && !addr.internal)
					.map((addr) => addr.address)
			);

		const uniqueWifiIps = [...new Set(wifiIps)];
		const uniquePrivateLanIps = [...new Set(allExternalIps.filter((ip) => isPrivateIPv4(ip) && !uniqueWifiIps.includes(ip)))];
		const prioritizedIps = [...uniqueWifiIps, ...uniquePrivateLanIps];
		res.json({
			wifiAvailable: uniqueWifiIps.length > 0,
			wifiIps: uniqueWifiIps,
			privateLanIps: uniquePrivateLanIps,
			ips: prioritizedIps,
			urls: prioritizedIps.map((ip) => `http://${ip}:3000`),
		});
	});
};
