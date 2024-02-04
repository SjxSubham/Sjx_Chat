import jwt from "jsonwebtoken";

const generateTokenSetCookie = (userId, res) => {
    const token = jwt.sign({userId}, process.env.JWT_SECRET,{
        expiresIn: "15d",
    });

    res.cookie("jwt",token, {
        maxAge: 15 * 24 * 60 * 60 * 1000,
        httpOnly: true, // prevent excess attack cross site acsess attack
        sameSite:"strict", // CRSF attackts cross site request forgery attacks
        secure: process.env.NODE_ENV !== "development",
    });
};

export default generateTokenSetCookie;