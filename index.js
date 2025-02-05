#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const readline = require('readline');

const logger = require('./logger');

const program = new Command();
const dictionary = new Set();
const bonus = new Set();
const excluded = new Set();
const wordFragments = new Set();
var longestWordLength = 0;

// Create an interface for reading input from the user
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

program
    .version('1.0.0')
    .arguments('<function> [args...]')
    .description('Utilities for wordgriddle')
    .action((func, args) => {
        if (typeof functions[func] === 'function') {
            functions[func](...args);
        } else {
            console.error(`Function "${func}" not recognised.`);
            process.exit(1);
        }
    });

const functions = {
    grid: (filename) => {
        if (filename === undefined) {
            console.error("Requires filename");
        } else {
            gridFunction(filename);
        }
    },
    find: (filename) => {
        if (filename === undefined) {
            console.error("Requires filename");
        } else {
            findFunction(filename);
        }
    },
    diff: (allWords, targetWords) => {
        if (allWords === undefined || targetWords === undefined) {
            console.error("Requires two files; all words in puzzle, and target words in puzzle");
        } else {
            diffFunction(allWords, targetWords);
        }
    }
    // Add more functions here
};

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}

// Function to write lines of text to a file
function gridFunction(filename) {
    if (fs.existsSync(filename)) {
        rl.question(`File ${filename} already exists. Do you want to overwrite it? (yes/no): `, (overwrite) => {
            if (overwrite.toLowerCase() === 'yes' || overwrite.toLowerCase() === 'y') {
                gridFunctionImpl(filename);
            } else {
                console.log('Operation cancelled.');
                rl.close();
            }
        });
    } else {
        gridFunctionImpl(filename);
    }
}

// Function to find words in a grid file
function findFunction(filename) {
    if (fs.existsSync(filename)) {
        findFunctionImpl(filename);
    } else {
        console.log('File not found.');
    }
    rl.close();
}


function diffFunction(allWords, targetWords) {
    const result = diffFunctionImpl(allWords, targetWords);
    result.forEach((word) => {
        console.log(word);
    });
}

// Function to prompt the user and write to the file
function gridFunctionImpl(filename) {
    console.log(`Writing to file: ${filename}`);
    const writeStream = fs.createWriteStream(filename, { flags: 'w' });

    var lineLength = 0;
    var lineCount = 0;

    function promptAndWrite() {
        rl.question('Enter a line of text (or press Enter to finish): ', (line) => {
            if (line === '') {
                // Check for squareness, based on length of first line
                if (lineCount !== lineLength) {
                    console.warn(`Line count is inconsistent with length of first line (${lineCount} instead of ${lineLength})`);
                }

                writeStream.end();
                rl.close();
                console.log(`All lines have been written to ${filename}`);
            } else {
                // Check for line-by-line consistency
                if (lineLength === 0) {
                    lineLength = line.length;
                } else if (line.length !== lineLength) {
                    console.warn(`Line length is inconsistent (${line.length} instead of ${lineLength})`);
                }

                writeStream.write(line.toUpperCase() + '\n');
                lineCount++;

                promptAndWrite();
            }
        });
    }

    promptAndWrite();
}

// Function to read a text file and convert it into a two-dimensional array
function readGrid(filename, callback) {
    fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
            return callback(err);
        }

        // Split the file content into lines
        const lines = data.split('\n');

        // Map each line to an array of letters to make a 2D array
        const grid = lines.map(line => line.split(''));

        // Pass the result to the callback
        callback(null, grid);
    });
}

// Read a grid file and search it for words
function findFunctionImpl(filename) {
    readGrid(filename, (err, grid) => {
        if (err) {
            console.error('Error reading file:', err);
        } else {
            console.log('2D Array:', grid);
            findWords(grid);
        }
    });
}

// Search a grid (2D array) for words. The array *should* be square
function findWords(grid) {
    const bonusWords = fs.readFileSync('./data/bonus.txt', 'utf-8');
    bonusWords.split('\n').map(line => line.trim()).forEach((bonusWord) => {
        bonus.add(bonusWord);
    });

    const excludedWords = fs.readFileSync('./data/excluded.txt', 'utf-8');
    excludedWords.split('\n').map(line => line.trim()).forEach((excludedWord) => {
        excluded.add(excludedWord);
    });

    readDictionary('./data/dictionary.txt', (err) => {
        if (err) {
            console.error('Error reading dictionary:', err);
        } else {
            console.log(`Dictionary ${dictionary.size} words`);
            const allWords = findInGrid(grid);

            const regularWords = [];
            const bonusWords = [];
            const excludedWords = [];

            // allWords consists of word and path pairs. Split them by category
            allWords.forEach(([word, path]) => {
                if (excluded.has(word.word)) {
                    excludedWords.push([word, path]);
                } else if (bonus.has(word)) {
                    bonusWords.push([word, path]);
                } else {
                    regularWords.push([word, path]);
                }
            });

            // Display the results - may be piped to file

            // Grid letters
            let letters = '';
            grid.forEach((line) => {
                line.forEach((letter) => {
                    letters += letter;
                });
            });
            console.log(`Letters : ${letters}`);

            // All words
            console.log(`All ${allWords.length} words:`);
            allWords.forEach(([word, path]) => {
                console.log(word);
            });

            // Word list counts
            console.log(` : ${regularWords.length} regular words`);
            console.log(` : ${bonusWords.length} bonus words`);
            console.log(` : ${excludedWords.length} excluded words`);

            // Word lists as JSON
            console.log(`${JSON.stringify({ words: regularWords })}`);
            console.log(`${JSON.stringify({ bonusWords: bonusWords })}`);
            console.log(`${JSON.stringify({ excludedWords: excludedWords })}`);
        }
    });
}

function findInGrid(grid) {
    const wordsFound = new Array();

    // Iterate over the grid, letter by letter, and find words from each one
    for (var rowIndex = 0; rowIndex < grid.length; rowIndex++) {
        for (var columnIndex = 0; columnIndex < grid[rowIndex].length; columnIndex++) {
            findWordsFromPosition(grid, rowIndex, columnIndex, wordsFound, new Set(), "");
        }
    }

    //Sort the found words array by length and alphabetical within that
    const sorted = wordsFound.sort((a, b) => {
        const itemA = a[0];
        const itemB = b[0];
        if (itemA.length === itemB.length) {
            return itemA.localeCompare(itemB);
        }
        return itemA.length - itemB.length;
    });

    // Find all duplicated words (same word found by different path) and simplify down to one (randomly)
    const deDupArray = new Array();
    var index = 0;
    while (index < wordsFound.length) {
        const [word, path] = wordsFound[index];
        var lookAhead = index;
        while (lookAhead < wordsFound.length - 1) {
            const [nextWord, nextPath] = wordsFound[lookAhead + 1];
            if (word !== nextWord) {
                break;
            }

            lookAhead++;
        }

        if (lookAhead === index) {
            // No duplicates - simply add it to the list
            deDupArray.push([word, path]);
        } else {
            // Multiple ways to spell this word.
            const matches = lookAhead - index + 1;

            // Eliminate all but one of the ways
            // Randomise the one we choose (e.g. 4 matches means get a random number between 0-3 and add it to index)
            const elementToKeep = index + Math.floor(Math.random() * (matches));

            // Add the chosen one to the list
            deDupArray.push(wordsFound[elementToKeep]);

            // Move past the matching words
            index = lookAhead;
        }

        // Move on to the next word
        index++;
    }

    return deDupArray;
}

// Using grid(rowIndex,columnIndex), search for words
// Call this recursively, building visited and currentWord as we go
// Add found words to a set as we may find duplicates
function findWordsFromPosition(grid, row, col, wordsFound, visitedCoordinates, currentWord) {
    // Bounds checking
    if (row < 0 || row >= grid.length || col < 0 || col >= grid[row].length) {
        return;
    }

    // Create a string representation of row and column to act as a unique coordinate
    // Wrap the values in a string that makes them easy to match later - e.g. so the web page
    // can generate its own coordinate and look for it in a list associated with the puzzle in play
    //const coordinate = `[${row}x${col}]`;
    const index = (row * grid[row].length) + col;
    const coordinate = `[${index}]`;

    // Don't loop back over ourselves
    if (visitedCoordinates.has(coordinate)) {
        return;
    }

    // Remember we've been here
    visitedCoordinates.add(coordinate);

    // Now try the letter
    const currentLetter = grid[row][col];

    // Allow use of blanks or dots to signify missing letters
    if (currentLetter == ' ' || currentLetter == '.') {
        return;
    }

    currentWord += currentLetter.toLowerCase();

    if (currentWord.length >= 4 && dictionary.has(currentWord)) {
        // Coords are wrapped (above), so don't need any other separator
        const path = Array.from(visitedCoordinates).join('');

        // Store the word and the path taken to form it
        // We will prune duplicate words (with different paths) later
        wordsFound.push([currentWord, path]);
    }

    // Constrain the algorithm to avoid creating words that are too long
    if (currentWord.length < longestWordLength && wordFragments.has(currentWord)) {
        // Cross
        findWordsFromPosition(grid, row - 1, col, wordsFound, visitedCoordinates, currentWord);
        findWordsFromPosition(grid, row + 1, col, wordsFound, visitedCoordinates, currentWord);
        findWordsFromPosition(grid, row, col - 1, wordsFound, visitedCoordinates, currentWord);
        findWordsFromPosition(grid, row, col + 1, wordsFound, visitedCoordinates, currentWord);

        // Diagonal
        findWordsFromPosition(grid, row - 1, col - 1, wordsFound, visitedCoordinates, currentWord);
        findWordsFromPosition(grid, row - 1, col + 1, wordsFound, visitedCoordinates, currentWord);
        findWordsFromPosition(grid, row + 1, col - 1, wordsFound, visitedCoordinates, currentWord);
        findWordsFromPosition(grid, row + 1, col + 1, wordsFound, visitedCoordinates, currentWord);
    }

    visitedCoordinates.delete(coordinate);
}

// Read a word list into a string array
function readDictionary(filename, callback) {
    fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
            return callback(err);
        }

        // Split the file content into lines
        const lines = data.split('\n');

        // Map each line to an list of words
        lines.forEach(line => {
            word = line.trim();

            dictionary.add(word);

            if (word.length > longestWordLength) {
                longestWordLength = word.length;
            }

            while (word.length > 1) {
                word = word.slice(0, -1);
                wordFragments.add(word);
            }
        });

        // Pass the result to the callback
        callback(null);
    });
}

// Given a list of all words and target words, return words only in 'all words'
// Essentially this extracts bonus words
function diffFunctionImpl(file1, file2) {
    try {
        const content1 = fs.readFileSync(file1, 'utf8');
        const content2 = fs.readFileSync(file2, 'utf8');

        const list1 = content1.split('\n').map(word => word.trim());
        const list2 = content2.split('\n').map(word => word.trim());

        return list1.filter(word => !list2.includes(word));
    } catch (err) {
        console.error('Error reading files:', err);
        return [];
    }
}