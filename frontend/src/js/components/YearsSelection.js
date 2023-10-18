import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';

const API_URL = process.env.REACT_APP_API_URL;

function YearsSelection() {

    // useState variables rerender the html everytime there are changed
  const [datasetsYear,setDatasetsYear] = useState([]);

  const responseJson = useRef(null);

  // fetches for all availible years in the dataset
  const fetchYears = async () => {
    const response = await fetch(`${API_URL}/getAvailibleYears`);
    responseJson.current = await response.json()

    setDatasetsYear(responseJson.current);
  }

  // called once the page is opend
  useEffect(() => {
    // current year is selected automatically and saved in session storage
    window.year = (window.sessionStorage.getItem('year') == null) ? new Date().getFullYear().toString() : window.sessionStorage.getItem('year');
    window.sessionStorage.setItem('year', window.year);
    fetchYears();    
  },[]);


  // this html element is empty if no year is found in the fetched data
  // otherwise it creates an button for each year which saves the year of the button
  // in the session storage if clicked.
  return (
    datasetsYear == null ?  <div></div> :
      <div>
        {window.year == "" ? 
          <li className="sidebar-item active">
            <a className="sidebar-link" onClick={() => {window.sessionStorage.setItem('year', ""); window.year = ""; location.reload()}}>
              <i className="align-middle" data-feather="sliders"></i> <span className="align-middle">Alle Jahre</span>
            </a>	
          </li> 
        : 
          <li className="sidebar-item">
            <a className="sidebar-link" onClick={() => {window.sessionStorage.setItem('year', ""); window.year = ""; location.reload()}}>
              <i className="align-middle" data-feather="sliders"></i> <span className="align-middle">Alle Jahre</span>
            </a>	
          </li>
        }
      <div className="buttons-list" > 
          { datasetsYear.map(element => window.year == element ? 
            <li className="sidebar-item active" key={element}>
              <a className="sidebar-link" onClick={() => {window.sessionStorage.setItem('year', element); window.year = element; location.reload()}}>
                <i className="align-middle" data-feather="sliders"></i> <span>{element < 2000? "Unbekannt": element}</span>
              </a>
            </li> 
          : 
            <li className="sidebar-item" key={element}>
              <a className="sidebar-link" onClick={() => {window.sessionStorage.setItem('year', element); window.year = element; location.reload()}}>
                <i className="align-middle" data-feather="sliders"></i> <span>{element < 2000? "Unbekannt": element}</span>
              </a>
            </li>)}
      </div>
      </div>
  );
}
  
  const domNode = document.getElementById('years-selection');
  const root = createRoot(domNode);
  root.render(<YearsSelection />);