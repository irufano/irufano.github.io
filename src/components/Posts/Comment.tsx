const Comment = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gray-700 bg-opacity-50 flex justify-center items-center rounded-lg p-4">
        <span className="text-white text-xl font-semibold text-center">
          Sorry, comment is under maintenance
        </span>
      </div>
      <div className="opacity-20 p-4">
        <input
          type="text"
          placeholder="Your email..."
          className="w-full p-2 mb-4 border-2 border-gray-400 rounded dark:bg-gray-700 placeholder-gray-500 dark:border-gray-700"
          disabled
        />
        <input
          type="text"
          placeholder="Write a comment..."
          className="w-full h-24 p-2 mb-4 border-2 border-gray-400 rounded dark:bg-gray-700 placeholder-gray-500 dark:border-gray-700"
          disabled
        />
        <button
          className="w-full text-white py-2 rounded transition-all bg-primary dark:bg-primary-dark hover:bg-primary/80 dark:hover:bg-primary/80"
          disabled
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default Comment;
