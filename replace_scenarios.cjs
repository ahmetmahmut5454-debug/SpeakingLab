const fs = require('fs');
let code = fs.readFileSync('src/lib/scenarios.ts', 'utf8');

const regex = /export interface Scenario \{([\s\S]*?)\}/;
code = code.replace(regex, `export interface Scenario {$1  imageUrl?: string;\n}`);

code = code.replace(/id: "s1",([\s\S]*?)level: "A2",/m, 'id: "s1",\n    imageUrl: "https://images.unsplash.com/photo-1471018259965-02b4bc9da464?w=500&q=80",$1level: "A2",');
code = code.replace(/id: "s2",([\s\S]*?)level: "A2",/m, 'id: "s2",\n    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80",$1level: "A2",');
code = code.replace(/id: "s3",([\s\S]*?)level: "B1-B2",/m, 'id: "s3",\n    imageUrl: "https://images.unsplash.com/photo-1628102491629-77858ab5721d?w=500&q=80",$1level: "B1-B2",');
code = code.replace(/id: "s4",([\s\S]*?)level: "B1-B2",/m, 'id: "s4",\n    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80",$1level: "B1-B2",');
code = code.replace(/id: "s5",([\s\S]*?)level: "C1",/m, 'id: "s5",\n    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&q=80",$1level: "C1",');
code = code.replace(/id: "s6",([\s\S]*?)level: "C1",/m, 'id: "s6",\n    imageUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=500&q=80",$1level: "C1",');

fs.writeFileSync('src/lib/scenarios.ts', code);
