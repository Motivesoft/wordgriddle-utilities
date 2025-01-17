#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const readline = require('readline');

const logger = require('./logger');

const program = new Command();

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
                if (lineCount !== lineLength ) {
                    console.warn(`Line count is inconsistent with length of first line (${lineCount} instead of ${lineLength})`);
                }

                writeStream.end();
                rl.close();
                console.log(`All lines have been written to ${filename}`);
            } else {
                // Check for line-by-line consistency
                if (lineLength === 0) {
                    lineLength = line.length;
                } else if (line.length !== lineLength ) {
                    console.warn(`Line length is inconsistent (${line.length} instead of ${lineLength})`);
                }

                writeStream.write(line + '\n');
                lineCount++;

                promptAndWrite();
            }
        });
    }

    promptAndWrite();
}