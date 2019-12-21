export const onUpdateLocation = (onUpdateActive, dimension, amount) => {
  const fn = obj => {
    [`${dimension}`, `${dimension}1`, `${dimension}2`].forEach(d => {
      if (obj[d] != null) {
        obj[d] += amount;
      }
    });
  };

  onUpdateActive(fn);
};
