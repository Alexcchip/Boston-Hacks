// Button.js
import React from 'react';
import Post from './post';
  
function Feed({ posts }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-orange-200 pt-20">
      {posts.map((post) => (
        <div key={post.post_id} className="mb-4">
          <Post post={post} />
        </div>
      ))}
    </div>
  );
}

export default Feed;
