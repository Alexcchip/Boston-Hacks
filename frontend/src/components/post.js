// Button.js
import React from 'react';
  
function Post({ post }) {
  return (
    <div className="border p-4 rounded-lg shadow-md bg-white max-w-xs sm:max-w-sm md:max-w-md w-full mx-auto">
      <h2 className="text-lg font-bold">{post.username}</h2>
      <p className="text-gray-600">{post.caption}</p>
      <img src={post.photo} alt="post" className="mt-2 w-full h-auto rounded" />
      <p className="text-sm text-gray-500">{post.posted_at.toLocaleString()}</p>
    </div>
  );
}

export default Post;
