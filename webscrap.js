const request = require('request'),
    async = require('async'),
    fs = require('fs'),
    cheerio = require('cheerio'),
    csvWriter = require('csv-write-stream'),
    URL = require('url').URL;

var map = new Map();
// require('events').EventEmitter.defaultMaxListeners = 15;

const writer = csvWriter({
    headers: ['link', 'num']
});
writer.pipe(fs.createWriteStream('links.csv'), {
    flags: 'a'
});
const MAX_WORKERS = 5;

let numCPUs = require('os').cpus().length;
let todo = [];
let queue = async.queue(processURL, MAX_WORKERS);
queue.push('https://medium.com/');

function processURL(url, callback) {
    todo.push(url);
    request(url, (error, response, html) => {
        if (!error) {
            const $ = cheerio.load(html);
            let arr = [];
            $('a').filter(function(output) {
                let data = $(this);
                arr.push(data.attr().href);
            });

            // for (let i = 0; i < arr.length; i++) {
            //     console.log(arr[i] + " aarrrrr[iii  \n");
            // }

            let b = removeDuplicates(arr);
            for (let j = 0; j < b.length; j++) {
                // console.log(b[j] + '    B[jjj');
                if (b[j] && todo.indexOf(b[j]) === -1 && isURL(b[j])) {
                    todo.push(b[j]);
                    queue.push(b[j], err => {
                        if (err) {
                            console.log(err);
                        }
                    });
                    let url = new URL({ toString: () => b[j] });
                    // console.log(url.hostname + " +++++++++++++" + url.pathname + "  ++++ ");
                    if (!map.has(url.hostname + url.pathname)) {
                        map.set(url.hostname + url.pathname, 1);
                        // console.log(map.get(url.hostname + url.pathname));

                    } else
                        map.set(url.hostname + url.pathname, map.get(url.hostname + url.pathname) + 1);

                    // writer.write(b[j]);
                    // createDB();
                }
            }
            // console.log(map);

            Object.keys(map).forEach(function(key) {
                console.log(map[key]);
                writer.write(key);
            });

            // if (map != undefined)
            //     map.forEach(writer1())

            // console.log(`Proccessed URL ${url}`);
            callback();
        } else {
            console.error(error);
            callback(error);
        }
    });
}

function writer1(value, key, map) {
    console.log(key, value);
    if (key)
        writer.write(key, value);

}

function removeDuplicates(arr) {
    var uniqueLinks = [];
    arr.forEach(element => {
        if (uniqueLinks.indexOf(element) === -1) {
            uniqueLinks.push(element);
        }
    });
    return uniqueLinks;
}

function isURL(url) {
    // console.log(`URL Sunstring ${url.substring(0,5)}`);
    if (url.substring(0, 18) === 'https://medium.com') {
        return true;
    } else {
        return false;
    }
}