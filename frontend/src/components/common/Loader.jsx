const Loader = ({ text = 'Loading...' }) => (
  <div className="loader-container">
    <div className="spinner" />
    <p>{text}</p>
  </div>
);

export default Loader;
