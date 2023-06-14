import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import fetch from "node-fetch";
import prisma from "./prisma.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;
app.use(express.json());
app.use(morgan("dev"));
app.get("/", (req, res) => {
    res.send("Hello World!");
});
app.get("/api/generate_id", async (req, res) => {
    const user = await prisma.user.create({
        data: {},
    });
    res.json(user);
});
app.post("/api/get_tasks", async (req, res) => {
    const { user_id } = req.body;
    try {
        const tasks = await prisma.task.findMany({
            where: {
                userId: user_id,
            },
        });
        res.status(200).json(tasks);
    }
    catch (e) {
        console.error(e);
        res.status(400).json(e);
    }
});
app.post('/api/add_task', async (req, res) => {
    const { user_id, task, group_id } = req.body;
    try {
        const new_task = await prisma.task.create({
            data: {
                name: task.name,
                location: task.location,
                latitude: task.latitude,
                longitude: task.longitude,
                userId: user_id || undefined,
                groupId: group_id || undefined,
            }
        });
        res.status(200).json(new_task);
    }
    catch (e) {
        console.error(e);
        res.status(400).json(e);
    }
});
app.post("/api/complete_task", async (req, res) => {
    const { user_id, task_id } = req.body;
    try {
        const completed_task = await prisma.task.update({
            where: {
                id: task_id,
                userId: user_id,
            },
            data: {
                completed: true,
            },
        });
        res.status(200).json(completed_task);
    }
    catch (e) {
        console.error(e);
        res.status(400).json(e);
    }
});
app.post("/api/delete_task", async (req, res) => {
    const { user_id, task_id } = req.body;
    try {
        const deleted_task = await prisma.task.delete({
            where: {
                id: task_id,
                userId: user_id,
            },
        });
        res.status(200).json(deleted_task);
    }
    catch (e) {
        console.error(e);
        res.status(400).json(e);
    }
});
// get all the groups of the user
app.post("/api/get_groups", async (req, res) => {
    const { user_id } = req.body;
    try {
        const groups = await prisma.user.findUnique({
            where: {
                id: user_id,
            },
            include: {
                groups: true,
            },
        });
        res.status(200).json(groups);
    }
    catch (e) {
        console.error(e);
        res.status(400).json(e);
    }
});
app.post("/api/create_group", async (req, res) => {
    const { group_name, user_id } = req.body;
    try {
        const new_group = await prisma.group.create({
            data: {
                name: group_name,
                users: {
                    connect: {
                        id: user_id,
                    },
                },
            },
        });
        res.status(200).json(new_group);
    }
    catch (e) {
        console.error(e);
        res.status(400).json(e);
    }
});
app.post("/api/join_group", async (req, res) => {
    const { user_id, group_id } = req.body;
    try {
        const join_group = await prisma.group.update({
            where: {
                id: group_id,
            },
            data: {
                users: {
                    connect: {
                        id: user_id,
                    },
                },
            },
            include: {
                users: true,
            },
        });
        res.status(200).json(join_group);
    }
    catch (e) {
        console.error(e);
        res.status(400).json(e);
    }
});
app.get("/api/search_location", async (req, res) => {
    try {
        const { query, latitude, longitude } = req.query;
        const radius = 1000;
        console.log("Search params:", query, latitude, longitude);
        const response = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=${query}&location=${latitude}%2C${longitude}&radius=${radius}&key=${process.env.GOOGLE_MAPS_API}`);
        const data = await response.json();
        res.status(200).json(data);
    }
    catch (e) {
        console.error(e);
        res.status(400).json(e);
    }
});
app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
});