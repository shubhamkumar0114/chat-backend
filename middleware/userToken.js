import jwt from "jsonwebtoken"
export async function generateToken(userId , res){
    try {
        const token = jwt.sign({userId} , process.env.SECRETPASS , {expiresIn: "1d"})
        res.cookie("token" , token)
        return token
    } catch (error) {
        return console.log("Error in token generate")
    }
}

export async function userAuth(req , res , next) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "Token missing" });
    // const token = req.cookies.token;
    const token = authHeader.split(" ")[1]; // "Bearer <token>"

    // Header format: "Authorization: Bearer <token>"

    if (!token) return res.status(401).json({ message: "No token provided" });

    jwt.verify(token, process.env.SECRETPASS, (err, decoded) => {
      if (err) return res.status(403).json({ message: "Invalid token" });

      req.user = decoded; // decoded payload (id, email)
      next();
    });
  } catch (error) {
    return res.status(500).json({error: error.message})
  }
}