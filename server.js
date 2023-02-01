const sqlite3 = require("sqlite3").verbose();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

const database = new sqlite3.Database('./database.db', (error) => {

    if (error) {
        return console.error(error);
    }

    console.log("Connection to the SQlite database successful.")
});

database.serialize(() => {
    database.run(`
    CREATE TABLE IF NOT EXISTS authorGallery
     (
            id INTEGER PRIMARY KEY,
            author CHAR(100) NOT NULL,
            alt CHAR(100) NOT NULL,
            tags CHAR(256) NOT NULL,
            image char(2048) NOT NULL,
            description CHAR(1024) NOT NULL
    )
    `
    );

    const alreadyMadeAuthorsData = getAlreadyMadeAuthors();

    alreadyMadeAuthorsData.forEach((authorData) => {
        database.run(`INSERT INTO authorGallery (image, author, alt, tags, description) VALUES (?, ?, ?, ?, ?)`, [authorData.image, authorData.author, authorData.alt, authorData.tags, authorData.description])

    });
});

app.get("/api/authors", (request, response) => {

    database.all('SELECT * FROM authorGallery', (error, authorData) => {
        if (error) {

            return response.status(500).json({
                error: 'Error retrieving authors'
            });
        }
        response.status(200).json(authorData);

    });
});

app.get("/api/authors/:id", (request, response) => {

    database.get(`SELECT * FROM authorGallery WHERE id = ?`, [request.params.id], (error, row) => {
        if (error) {
            return response.status(500).json({
                error: 'Error retrieving author'
            });
        }

        if (row === undefined) {
            return response.status(404).json({
                error: 'ID of author not found'
            });
        }
        response.status(200).json(row);
    });
});

app.post("/api/authors", (request, response) => {
    const expectedProperties = ["author", "alt", "tags", "image", "description"];
    const bodyKeys = Object.keys(request.body);
    const hasAdditionalProperties = bodyKeys.some((key) => !expectedProperties.includes(key));
    const hasAllProperties = expectedProperties.every((property) => bodyKeys.includes(property));
    const URL_REGEX = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%.\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%\+.~#?&//=]*)/;
    const isValidURL = URL_REGEX.test(request.body.image);

    if (!isValidURL) {
        return response.status(400).json({
            error: "Invalid URL in request body",
        });
    }


    if (hasAdditionalProperties) {
        return response.status(400).json({
            error: "Invalid request body, additional properties present",
        });
    }
    if (!hasAllProperties) {
        return response.status(400).json({
            error: "Invalid request body, missing required properties",
        });
    }

    const { image, author, alt, tags, description } = request.body;


    database.run(`INSERT INTO authorGallery (image, author, alt, tags, description) VALUES (?, ?, ?, ?, ?)
    `, [image, author, alt, tags, description], (error) => {
        if (error) {
            return response.status(400).json({
                error: 'Invalid data'
            });
        }

        let authorID;

        database.get(`SELECT COUNT(*) as count from authorGallery`, (error, row) => {
            if (error) {
                response.status(500).json({ error: 'Server error' });

            }
            authorID = row.count;
            outputResponse();
        });

        const outputResponse = () => {
            response.status(201).json({ message: 'Author created with ID: ' + authorID });

        };
    });
});

app.put("/api/authors/:id", (request, response) => {
    const id = request.params.id;
    const expectedProperties = ["author", "alt", "tags", "image", "description"];
    const bodyKeys = Object.keys(request.body);
    const hasAdditionalProperties = bodyKeys.some((key) => !expectedProperties.includes(key));
    const URL_REGEX = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%.\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%\+.~#?&//=]*)/;
    const isValidURL = URL_REGEX.test(request.body.image);


    if (id < 14 && id > 0) {

        return response.status(401).json({ error: 'Unauthorized access to author' });

    }

    if (hasAdditionalProperties) {
        return response.status(400).json({
            error: "Invalid request body, additional properties present",
        });
    }

    if (!isValidURL) {
        return response.status(400).json({
            error: "Invalid URL in request body",
        });
    }

    if (id < 14 && id > 0) {

        return response.status(401).json({ error: 'Unauthorized access to author' });

    }

    const { image, author, alt, tags, description } = request.body;

    database.get(`SELECT * FROM authorGallery WHERE id = ?`, [id], (error, row) => {
        if (error) {
            return response.status(500).json({ error: "Error fetching author" });
        }
        if (!row) {
            return response.status(404).json({ error: "Author not found" });
        }

        database.run(
            `UPDATE authorGallery SET image = ?, author = ?, alt = ?, tags = ?, description = ? WHERE id = ?`,
            [image, author, alt, tags, description, id],
            (error) => {
                if (error) {
                    return response.status(400).json({ error: "Error updating author. Invalid data." });
                }
                response.status(200).json({ message: "Author updated" });
            }
        );
    });
});

app.delete("/api/authors/:id", (request, response) => {
    const id = request.params.id;

    if (id < 14 && id > 0) {

        return response.status(401).json({ error: 'Unauthorized access to author' });

    }

    database.get(`SELECT * FROM authorGallery WHERE id = ?`, [id], (error, row) => {
        if (error) {
            return response.status(500).json({ error: 'Error fetching author' });
        }
        if (!row) {
            return response.status(404).json({ error: 'Author not found' });
        }

        database.run('DELETE FROM authorGallery WHERE id = ?', [id], (error) => {
            if (error) {
                return response.status(500).json({ error: 'Error deleting author' });
            }
            response.status(204).json({});
        });
    });
});

app.get("/api/reset", (request, response) => {
    let tableRowCount;

    database.get(`SELECT COUNT(*) as count from authorGallery`, (error, row) => {
        if (error) {
            response.status(500).json({ error: 'Server error' });

        }
        tableRowCount = row.count;
        resetTable();
    });

    const resetTable = () => {

        database.run(`DELETE FROM authorGallery WHERE ID BETWEEN ? AND ?`, [14, tableRowCount], (error) => {
            if (error) {
                response.status(500).json({ error: 'Server error' });
            } else {
                response.status(204).json({ error: 'Authors that user added deleted' });

            }
        })

    };
});

app.use(function (request, response, next) {

    response.status(404).json({
        status: 404,
        success: false,
        error: "Invalid request URL"
    });
});

app.listen(3000, () => {
    console.log("API running and listening on http://localhost:3000...");
});

function getAlreadyMadeAuthors() {

    const alreadyMadeAuthorsData = [

        {
            id: 1,
            author: "Grace Hopper",
            alt: "Image of Grace Hopper at the UNIVAC I console",
            tags: "programming,linking,navy",
            image: "https://upload.wikimedia.org/wikipedia/commons/3/37/Grace_Hopper_and_UNIVAC.jpg",
            description: "Grace was very curious as a child; this was a lifelong trait. At the age of seven, she decided to determine how an alarm clock worked and dismantled seven alarm clocks before her mother realized what she was doing (she was then limited to one clock)."
        },

        {
            id: 2,
            author: "Enrico Fermi",
            alt: "Image of Fermi",
            tags: "prof,manhattan,smart",
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKaRl6HUZmQ0cu-DMrkgopcCdvn9gTkQboa-5STW-3&s",
            description: "Long description of image of Fermi."
        },
        {
            id: 3,
            author: "Otto Hahn",
            alt: "Image of Hahn",
            tags: "prof,man,smart",
            image: "https://www.nobelprize.org/images/hahn-13028-portrait-medium.jpg",
            description: "Long description of image of Hahn"
        },
        {
            id: 4,
            author: "Robert Oppenheimer",
            alt: "Image of Oppenheimer",
            tags: "prof,man,smart",
            image: "https://www.atomicarchive.com/img/bios/oppenheimer.jpg",
            description: "Long description of image of Oppenheimer."
        },
        {
            id: 5,
            author: "Werner Heisenberg",
            alt: "Image of Heisenberg",
            tags: "chemistry, physics",
            image: "https://upload.wikimedia.org/wikipedia/en/0/03/Walter_White_S5B.png",
            description: "This isn't actually Werner Heisenberg but who reads these long descriptions anyway."
        },
        {
            id: 6,
            author: "Ken Thompson",
            alt: "Image of Thompson",
            tags: "prof,man,smart",
            image: "https://ieeecs-media.computer.org/wp-media/2018/03/30194024/ken-thompson-e1522438858381.jpg",
            description: "Ken Thompson did stuff with computers."
        },
        {
            id: 7,
            author: "Ken Thompson",
            alt: "Image of Thompson",
            tags: "chess,unix",
            image: "https://www.unixmen.com/wp-content/uploads/2015/10/thompson01.jpg",
            description: "Another image of Ken Thompson."
        },
        {
            id: 8,
            author: "Ken Thompson",
            alt: "Image of Thompson",
            tags: "chess,unix",
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Ken_Thompson_and_Dennis_Ritchie--1973.jpg/250px-Ken_Thompson_and_Dennis_Ritchie--1973.jpg",
            description: "Ken was on the forefront of chess computers."
        },
        {
            id: 9,
            author: "Tim Berners-Lee",
            alt: "Image of Berners-Lee",
            tags: "html,http,url,cern,mit",
            image: "https://entrepreneurship.mit.edu/wp-content/uploads/Tim-Berners-Lee-640-1.jpg",
            description: "The internet and the Web aren't the same thing."
        },
        {
            id: 10,
            author: "Tim Berners-Lee",
            alt: "Image of Berners-Lee",
            tags: "www,internet",
            image: "https://cdn.britannica.com/94/123894-050-53EC378E/Tim-Berners-Lee-2005.jpg",
            description: "TimBL works at MIT nowadays"
        },
        {
            id: 11,
            author: "Richard Feynman",
            alt: "Image of Feynman",
            tags: "physics,man,nobel",
            image: "https://www.nobelprize.org/images/feynman-13184-portrait-medium.jpg",
            description: "Long description of image of Feynman."
        },
        {
            id: 12,
            author: "Karen Spärck Jones",
            alt: "Image of Karen Spärck Jones in 2002 (University of Cambridge)",
            tags: "IDF,retrieval,nlp",
            image: "https://upload.wikimedia.org/wikipedia/commons/a/af/Karen_Sp%C3%A4rck.jpg",
            description: "Karen Sparck-Jones discoveries helped pave the way for modern-day information retrieval that allows search engines to quickly identify the most relevant results and curate millions of responses to internet queries."
        },
        {
            id: 13,
            author: "Grace Hopper",
            alt: "Image of Grace Hopper at the UNIVAC I console",
            tags: "programming,linking,navy",
            image: "https://upload.wikimedia.org/wikipedia/commons/3/37/Grace_Hopper_and_UNIVAC.jpg",
            description: "Grace was very curious as a child; this was a lifelong trait. At the age of seven, she decided to determine how an alarm clock worked and dismantled seven alarm clocks before her mother realized what she was doing (she was then limited to one clock)."
        }
    ];

    return alreadyMadeAuthorsData;

}