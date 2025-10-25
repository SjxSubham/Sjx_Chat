import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import cloudinary from "../utils/cloudinary.js";
import streamifier from "streamifier";
import { validateImageFile } from "../utils/imageValidator.js";

export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message: message || null,
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    await Promise.all([conversation.save(), newMessage.save()]);

    // SOCKET FUNCTIONALITY
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("error in send message controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Validate image file
    const validation = validateImageFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const fileSize = req.file.size;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "sjx_chat/images",
        resource_type: "auto",
        format: "jpg",
        quality: "auto",
        max_bytes: 2 * 1024 * 1024,
      },
      (error, result) => {
        if (error) {
          console.log("Cloudinary upload error:", error);
          return res
            .status(500)
            .json({ error: "Failed to upload image to Cloudinary" });
        }

        res.status(200).json({
          imageUrl: result.secure_url,
          imageSize: fileSize,
          publicId: result.public_id,
        });
      },
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (error) {
    console.log("error in upload image controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendImageMessage = async (req, res) => {
  try {
    const { imageUrl, imageSize, message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message: message || null,
      image: imageUrl,
      imageSize: imageSize || null,
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    await Promise.all([conversation.save(), newMessage.save()]);

    // SOCKET FUNCTIONALITY
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("error in send image message controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessage = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;
    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
    }).populate("messages");

    if (!conversation) return res.status(200).json([]);
    const messages = conversation.messages;

    res.status(200).json(messages);
  } catch (error) {
    console.log("error in get message controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
