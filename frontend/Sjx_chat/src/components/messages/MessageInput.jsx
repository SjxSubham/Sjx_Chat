import React from "react";
import { BsSend } from "react-icons/bs";
import { HiOutlineEmojiHappy } from "react-icons/hi";
import { MdOutlineImageNotSupported } from "react-icons/md";
import useSendMessage from "../../hooks/useSendMessage";
import { useState, useRef } from "react";
import EmojiPicker from "./EmojiPicker";
import QuickEmojiBar from "./QuickEmojiBar";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { loading, sendMessage, sendImageMessage } = useSendMessage();
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  const handleImageSelect = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, GIF, and WebP images are allowed");
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImageToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/messages/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to upload image");
      }

      return data;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim() && !selectedImage) return;

    if (selectedImage) {
      setUploading(true);
      try {
        const uploadData = await uploadImageToCloudinary(selectedImage);
        await sendImageMessage(
          uploadData.imageUrl,
          uploadData.imageSize,
          message,
        );
        setMessage("");
        handleRemoveImage();
      } catch (error) {
        console.error("Error sending image:", error);
      } finally {
        setUploading(false);
      }
    } else {
      await sendMessage(message);
      setMessage("");
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji);
  };

  return (
    <div className="px-4 my-3">
      {/* Quick Emoji Bar */}
      <QuickEmojiBar
        isVisible={showEmojiPicker}
        onEmojiSelect={handleEmojiSelect}
      />

      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-3 relative inline-block">
          <div className="relative bg-gray-800 rounded-lg p-2 border border-gray-600">
            <img
              src={imagePreview}
              alt="preview"
              className="h-32 w-32 object-cover rounded"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={uploading}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
              title="Remove image"
            >
              ✕
            </button>
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded flex items-center justify-center">
                <div className="loading loading-spinner loading-sm text-white"></div>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="w-full relative">
          <input
            type="text"
            className="border text-sm rounded-lg block w-full p-2.5 pr-32 bg-gray-900 border-gray-600 text-gray-300 bg-opacity-40 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder={
              imagePreview ? "Add a caption (optional)" : "Send A Message"
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={uploading}
          />

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
          />

          {/* Emoji Picker */}
          <div className="absolute bottom-0 left-2">
            <EmojiPicker
              isOpen={showEmojiPicker}
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>

          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={uploading}
            className={`absolute inset-y-0 right-20 flex items-center px-2 transition-colors duration-150 ${
              showEmojiPicker
                ? "text-yellow-400"
                : "text-gray-400 hover:text-yellow-400"
            } disabled:text-gray-600`}
            title="Add emoji"
          >
            <HiOutlineEmojiHappy className="w-5 h-5" />
          </button>

          {/* Image Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-y-0 right-12 flex items-center px-2 transition-colors duration-150 text-gray-400 hover:text-green-400 disabled:text-gray-600"
            title="Upload image (max 2MB)"
          >
            <MdOutlineImageNotSupported className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={
              (!message.trim() && !selectedImage) || loading || uploading
            }
            className={`absolute inset-y-0 right-0 flex items-center pe-3 transition-colors duration-150 ${
              (message.trim() || selectedImage) && !loading && !uploading
                ? "text-blue-400 hover:text-blue-300"
                : "text-gray-500"
            }`}
            title="Send message"
          >
            {loading || uploading ? (
              <div className="loading loading-spinner loading-sm"></div>
            ) : (
              <BsSend className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
