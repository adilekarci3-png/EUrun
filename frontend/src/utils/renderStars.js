  export const renderStars = (count, clickable = false,handleRating = () => {}) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        onClick={clickable ? () => handleRating(star) : undefined}
        style={{
          cursor: clickable ? "pointer" : "default",
          fontSize: "1.6rem",
          color: star <= count ? "#ffc107" : "#ccc",
          marginRight: "4px",
        }}
      >
        ★
      </span>
    ));
  };