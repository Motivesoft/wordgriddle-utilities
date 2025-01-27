const fs = require('fs').promises;

async function getDifference(file1, file2) {
    try {
        const [content1, content2] = await Promise.all([
            fs.readFile(file1, 'utf8'),
            fs.readFile(file2, 'utf8')
        ]);

        const list1 = content1.split('\n').map(word => word.trim());
        const list2 = content2.split('\n').map(word => word.trim());

        return list1.filter(word => !list2.includes(word));
    } catch (err) {
        console.error('Error reading files:', err);
        return [];
    }
}

async function main() {
    // Produce a list of bonus words by subtracting correct words from all words
    const args = process.argv.slice(2);
    if (args.length !== 2) {
        console.error('Usage: node maker.js <allwords.txt> <correctwords.txt>');
        process.exit(1);
    }

    const [file1, file2] = args;
    const result = await getDifference(file1, file2);
    result.forEach((word)=>{
        console.log(word);
    });
    //console.log(result);
}

main();
