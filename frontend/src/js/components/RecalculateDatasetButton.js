import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './../../css/RecalculateDatasetButton.css';

const API_URL = process.env.REACT_APP_API_URL;

// component of the button that re-calculates the dataset
function RecalculateDatasetButton() {

    const [loading,setLoading] = useState(false);

    const recalculateData = async () => {
      const response = await fetch(`${API_URL}/runDatabase`).then(
        setLoading(true) // true as long as the fetching takes
      );
      setLoading(false) // set false after fetching is done
    }


    return (
        <div>       
            <li className="sidebar-item">
              <a className="sidebar-link" onClick={() => recalculateData()}>
                <i className="align-middle" data-feather="sliders"></i> <span className="align-middle">Daten neuberechnen {loading ? <span className="loader"></span> : <div></div>}</span>
              </a>	
            </li> 
        </div>
    );
  }
  
  const domNode = document.getElementById('recalculate-dataset-button');
  const root = createRoot(domNode);
  root.render(<RecalculateDatasetButton />);