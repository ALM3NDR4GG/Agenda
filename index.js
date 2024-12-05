require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Person = require('./Models/person'); 

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('dist'));


const requestLogger = (request, response, next) => {
    console.log('Method:', request.method);
    console.log('Path:', request.path);
    console.log('Body:', request.body);
    console.log('---');
    next();
};

app.use(requestLogger);


app.get('/', (request, response) => {
    response.send('<h1>API REST FROM PERSONS</h1>');
});


app.get('/api/persons', (request, response) => {
    Person.find({}).then((persons) => response.json(persons));
});


app.get('/api/persons/:id', (request, response) => {
    Person.findById(request.params.id)
        .then((person) => {
            if (person) {
                response.json(person);
            } else {
                response.status(404).send({ error: 'Person not found' });
            }
        })
        .catch((error) => {
            console.error(error);
            response.status(400).send({ error: 'malformatted id' });
        });
});


app.delete('/api/persons/:id', (request, response) => {
    Person.findByIdAndDelete(request.params.id)
        .then((result) => {
            if (result) {
                console.log(`Person with id ${request.params.id} deleted.`);
                response.status(204).end();
            } else {
                response.status(404).send({ error: 'Person not found' });
            }
        })
        .catch((error) => {
            console.error('Error deleting person:', error.message);
            response.status(400).send({ error: 'Invalid ID format or delete failed' });
        });
});


app.post('/api/persons', (request, response) => {
    const body = request.body;

    if (!body.name || !body.number) {
        return response.status(400).json({ error: 'Name or number is missing' });
    }

    const person = new Person({
        name: body.name,
        number: body.number,
    });

    person
        .save()
        .then((savedPerson) => response.json(savedPerson))
        .catch((error) => {
            console.error(error);
            response.status(500).json({ error: 'Failed to save person' });
        });
});


app.put('/api/persons/:id', (request, response) => {
    const { name, number } = request.body;

    Person.findByIdAndUpdate(
        request.params.id,
        { name, number },
        { new: true, runValidators: true, context: 'query' }
    )
        .then((updatedPerson) => {
            if (updatedPerson) {
                response.json(updatedPerson);
            } else {
                response.status(404).end();
            }
        })
        .catch((error) => {
            console.error(error);
            response.status(400).send({ error: 'malformatted id' });
        });
});


app.get('/info', (request, response) => {
    Person.countDocuments({})
        .then((count) => {
            const currentDate = new Date();
            response.send(`
                <p>Phonebook has info for ${count} people</p>
                <p>${currentDate}</p>
            `);
        })
        .catch((error) => {
            console.error(error);
            response.status(500).json({ error: 'Failed to fetch info' });
        });
});


const initialPersons = [
    { name: "Arto Hellas", number: "040-123456" },
    { name: "Ada Lovelace", number: "39-44-5323523" },
    { name: "Dan Abramov", number: "12-43-234345" },
    { name: "Mary Poppendieck", number: "39-23-6423122" },
];

Person.find({})
    .then((existingPersons) => {
        if (existingPersons.length === 0) {
            console.log("Database is empty, adding initial persons...");
            return Person.insertMany(initialPersons);
        }
    })
    .then(() => {
        console.log("Initial persons added successfully.");
    })
    .catch((error) => {
        console.error("Error adding initial persons:", error.message);
    });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
