import Router from "express";

const router = Router();

router.post("/", (req, res, next)=>{
    
    // Check if uploaded formdata wrap is empty
    if(req.files == null){
        return res.status(400).json({"msg": "No file uploaded"});
    }

    // Checks if size it too big
    if(req.files.file.size >419430400){
        return res.status(400).json({"msg": "File too big (> 400Mb)"})
    }

    req.demo = req.files.file;
    next();
})

export default router;

