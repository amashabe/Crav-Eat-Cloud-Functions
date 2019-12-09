const { db } = require("../util/admin");

exports.getAllPosts = (request, response) => {
  db.collection("posts")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let posts = [];
      data.forEach(doc => {
        posts.push({
          postId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
          likeCount: doc.data().likeCount,
          commentCount: doc.data().commentCount
        });
      });
      return response.json(posts);
    })
    .catch(err => console.error(err));
};

exports.uploadPost = (request, response) => {
  const newPost = {
    body: request.body.body,
    userHandle: request.user.handle,
    createdAt: new Date().toISOString(),
    userImage: request.user.imageUrl,
    likeCount: 0,
    commentCount: 0
  };

  db.collection("posts")
    .add(newPost)
    .then(doc => {
      const responsePost = newPost;
      responsePost.postId = doc.id;
      response.json(responsePost);
    })
    .catch(err => {
      response.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
};

exports.getAPost = (request, response) => {
  let postData = {};
  db.doc(`/posts/${request.params.postId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return response.status(404).json({ error: "Scream not found" });
      }
      postData = doc.data();
      postData.postId = doc.id;
      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("postId", "==", request.params.postId)
        .get();
    })
    .then(data => {
      postData.comments = [];
      data.forEach(doc => {
        postData.comments.push(doc.data());
      });
      return response.json(postData);
    })
    .catch(err => {
      console.error(err);
      response.status(500).json({ error: err.code });
    });
};

// Comment on a comment
exports.commentOnPost = (request, response) => {
  if (request.body.body.trim() === '')
    return response.status(400).json({ comment: 'Must not be empty' });

  const newComment = {
    body: request.body.body,
    createdAt: new Date().toISOString(),
    screamId: request.params.screamId,
    userHandle: request.user.handle,
    userImage: request.user.imageUrl
  };
  console.log(newComment);

  db.doc(`/posts/${request.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return response.status(404).json({ error: 'Posts not found' });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection('comments').add(newComment);
    })
    .then(() => {
      response.json(newComment);
    })
    .catch((err) => {
      console.log(err);
      response.status(500).json({ error: 'Something went wrong' });
    });
};

exports.likePost = (request, response) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", request.user.handle)
    .where("postId", "==", request.params.postId)
    .limit(1);

  const postDocument = db.doc(`/posts/${request.params.postId}`);

  let postData;

  postDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        postData = doc.data();
        postData.postId = doc.id;
        return likeDocument.get();
      } else {
        return response.status(404).json({ error: "Post not found" });
      }
    })
    .then(data => {
      if (data.empty) {
        return db
          .collection("likes")
          .add({
            postId: request.params.postId,
            userHandle: request.user.handle
          })
          .then(() => {
            postData.likeCount++;
            return postDocument.update({ likeCount: postData.likeCount });
          })
          .then(() => {
            return response.json(postData);
          });
      } else {
        return response.status(400).json({ error: "Post already liked" });
      }
    })
    .catch(err => {
      console.error(err);
      response.status(500).json({ error: err.code });
    });
};

exports.unlikePost = (request, response) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", request.user.handle)
    .where("postId", "==", request.params.postId)
    .limit(1);

  const postDocument = db.doc(`/posts/${request.params.postId}`);

  let postData;

  postDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        postData = doc.data();
        postData.postId = doc.id;
        return likeDocument.get();
      } else {
        return response.status(404).json({ error: "Post not found" });
      }
    })
    .then(data => {
      if (data.empty) {
        return response.status(400).json({ error: "Posts not liked" });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            postData.likeCount--;
            return postDocument.update({ likeCount: postData.likeCount });
          })
          .then(() => {
            response.json(postData);
          });
      }
    })
    .catch(err => {
      console.error(err);
      response.status(500).json({ error: err.code });
    });
};

exports.deletePost = (request, response) => {
  const document = db.doc(`/posts/${request.params.postId}`);
  document
    .get()
    .then(doc => {
      if (!doc.exists) {
        return response.status(404).json({ error: "Post not found" });
      }
      if (doc.data().userHandle !== request.user.handle) {
        return response.status(403).json({ error: "Unauthorized" });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      response.json({ message: "Post deleted successfully" });
    })
    .catch(err => {
      console.error(err);
      return response.status(500).json({ error: err.code });
    });
};
