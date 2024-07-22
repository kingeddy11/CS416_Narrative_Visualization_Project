const margin = { top: 70, right: 100, bottom: 70, left: 80 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;


async function scene_25_34() {

    // SVG object
    const svg = d3
        .select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Defining groups and subgroups for side-by-side bar chart x-axis
    const subgroups = ["High_school_grad_or_higher_pct", "Bachelors_or_higher_pct"];
    const groups = ['United States', 'California', 'Pasadena'];
    const legendNames = ["High School Grad or Higher", "Bachelor's Degree or Higher"]

    // Create a mapping from subgroups to legend names
    const legendMapping = {
        "High_school_grad_or_higher_pct": "High School Grad or Higher",
        "Bachelors_or_higher_pct": "Bachelor's Degree or Higher"
    };

    // Color palette
    const color = d3.scaleOrdinal()
        .domain(subgroups)
        .range(['#bf212f', '#264b96']);

    // Tooltip
    const tooltip = d3.select("body")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip");

    // Legend for amount of education completed
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - margin.right + 20}, 0)`);

    legend.selectAll("rect")
        .data(subgroups)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", d => color(d));

    legend.selectAll("text")
        .data(legendNames)
        .enter()
        .append("text")
        .attr("x", 25)
        .attr("y", (d, i) => i * 20 + 15)
        .text(d => d)
        .style("font-size", "12px");

    // Chart title
    svg.append("text")
        .attr("class", "chart_title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text("Educational Attainment for Population 25 to 34 years old");

    // Loading data
    const data = await d3.csv("2021_2022_ACS_Educational_Attainment_data.csv");

    // Filtering for Age_Group = Population 25 to 34 years
    const new_data = data.filter(d => d.Age_Group === "Population 25 to 34 years");

    // X axis and X axis label
    const x = d3.scaleBand()
        .domain(groups)
        .range([0, width])
        .padding([0.2]);

    svg.append("g")
        .attr("class", "x_axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(0));

    svg.append("text")
        .attr("class", "x_axis_label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 30)
        .style("text-anchor", "middle")
        .text("Region");

    // X axis for subgroups
    const xsubgroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, x.bandwidth()])
        .padding([0.05]);

    // Y axis and Y axis label
    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    svg.append("g")
        .attr("class", "y_axis")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("class", "y_axis_label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 30)
        .style("text-anchor", "middle")
        .text("Percentage of Population (in percent)");

    // Variable to keep track of whether a bar is currently selected
    let clickedbar = null;

    // Function to display bars
    var displayBars = (filteredData) => {
        var bars = svg.selectAll("g.bars")
            .data(filteredData, d => d.Region);

        bars.exit().remove();

        var barsEnter = bars.enter().append("g")
            .attr("class", "bars")
            .attr("transform", d => `translate(${x(d.Region)},0)`);

        barsEnter.merge(bars).selectAll("rect")
            .data(d => subgroups.map(key => ({ key, value: +d[key], region: d.Region })))
            .join(
                enter => enter.append("rect")
                    .attr("x", d => xsubgroup(d.key))
                    .attr("y", height)
                    .attr("width", xsubgroup.bandwidth())
                    .attr("height", 0)
                    .attr("fill", d => color(d.key))
                    .call(enter => enter.transition().duration(1000)
                        .attr("y", d => y(d.value))
                        .attr("height", d => height - y(d.value))),
                update => update
                    .call(update => update.transition().duration(1000)
                        .attr("y", d => y(d.value))
                        .attr("height", d => height - y(d.value))),
                exit => exit
                    .call(exit => exit.transition().duration(1000)
                        .attr("height", 0)
                        .attr("y", height)
                        .remove())
            )
            .on("mouseover", (event, d) => {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                tooltip.html(`<b>Region:</b> ${d.region}
                        <br><b>Amount of Education Completed:</b> ${legendMapping[d.key]}
                        <br><b>Percent of Population:</b> ${d.value.toFixed(2)}%`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 10}px`);
            })
            .on("mouseout", () => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", (event, d) => {
                if (clickedbar === d.key) {
                    // If bar already highlighted, remove highlight and reset bars
                    svg.selectAll("rect").classed("dim", false);
                    legend.selectAll("rect").classed("dim", false);
                    clickedbar = null;
                } else {
                    // Dim the unclicked bars and legend while keeping selected bar same color
                    svg.selectAll("rect").classed("dim", true);
                    svg.selectAll(`rect[fill='${color(d.key)}']`).classed("dim", false);
                    legend.selectAll("rect").classed("dim", true);
                    legend.select(`rect[fill='${color(d.key)}']`).classed("dim", false);
                    clickedbar = d.key;
                }
            });

        // Add data labels
        barsEnter.merge(bars).selectAll("text")
            .data(d => subgroups.map(key => ({ key, value: +d[key], region: d.Region })))
            .join(
                enter => enter.append("text")
                    .attr("x", d => xsubgroup(d.key) + xsubgroup.bandwidth() / 2)
                    .attr("y", d => y(d.value) - 5)
                    .attr("text-anchor", "middle")
                    .text(d => `${d.value}%`)
                    .style("font-size", "12px")
                    .style("opacity", 0)
                    .call(enter => enter.transition().duration(1000)
                        .style("opacity", 1)),
                update => update
                    .call(update => update.transition().duration(1000)
                        .attr("y", d => y(d.value) - 5)
                        .text(d => `${d.value}%`)),
                exit => exit
                    .call(exit => exit.transition().duration(1000)
                        .style("opacity", 0)
                        .remove())
            );
    };

    // Initially display for 2022
    displayBars(new_data.filter(d => d.Year === "2022"));

    // Event listener for radio button change
    d3.selectAll('input[name="select"]').on('change', function () {
        const selectedYear = this.value;
        displayBars(new_data.filter(d => d.Year === selectedYear));
    });
}


async function scene_35_44() {

    // SVG object
    const svg = d3
        .select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Defining groups and subgroups for side-by-side bar chart x-axis
    const subgroups = ["High_school_grad_or_higher_pct", "Bachelors_or_higher_pct"];
    const groups = ['United States', 'California', 'Pasadena'];
    const legendNames = ["High School Grad or Higher", "Bachelor's Degree or Higher"]

    // Create a mapping from subgroups to legend names
    const legendMapping = {
        "High_school_grad_or_higher_pct": "High School Grad or Higher",
        "Bachelors_or_higher_pct": "Bachelor's Degree or Higher"
    };

    // Color palette
    const color = d3.scaleOrdinal()
        .domain(subgroups)
        .range(['#bf212f', '#264b96']);

    // Tooltip
    const tooltip = d3.select("body")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip");

    // Legend for amount of education completed
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - margin.right + 20}, 0)`);

    legend.selectAll("rect")
        .data(subgroups)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", d => color(d));

    legend.selectAll("text")
        .data(legendNames)
        .enter()
        .append("text")
        .attr("x", 25)
        .attr("y", (d, i) => i * 20 + 15)
        .text(d => d)
        .style("font-size", "12px");

    // Chart title
    svg.append("text")
        .attr("class", "chart_title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text("Educational Attainment for Population 35 to 44 years old");

    // Loading data
    const data = await d3.csv("2021_2022_ACS_Educational_Attainment_data.csv");

    // Filtering for Age_Group = Population 35 to 44 years
    const new_data = data.filter(d => d.Age_Group === "Population 35 to 44 years");

    // X axis and X axis label
    const x = d3.scaleBand()
        .domain(groups)
        .range([0, width])
        .padding([0.2]);

    svg.append("g")
        .attr("class", "x_axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(0));

    svg.append("text")
        .attr("class", "x_axis_label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 30)
        .style("text-anchor", "middle")
        .text("Region");

    // X axis for subgroups
    const xsubgroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, x.bandwidth()])
        .padding([0.05]);

    // Y axis and Y axis label
    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    svg.append("g")
        .attr("class", "y_axis")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("class", "y_axis_label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 30)
        .style("text-anchor", "middle")
        .text("Percentage of Population (in percent)");

    // Variable to keep track of whether a bar is currently selected
    let clickedbar = null;

    // Function to display bars
    var displayBars = (filteredData) => {
        var bars = svg.selectAll("g.bars")
            .data(filteredData, d => d.Region);

        bars.exit().remove();

        var barsEnter = bars.enter().append("g")
            .attr("class", "bars")
            .attr("transform", d => `translate(${x(d.Region)},0)`);

        barsEnter.merge(bars).selectAll("rect")
            .data(d => subgroups.map(key => ({ key, value: +d[key], region: d.Region })))
            .join(
                enter => enter.append("rect")
                    .attr("x", d => xsubgroup(d.key))
                    .attr("y", height)
                    .attr("width", xsubgroup.bandwidth())
                    .attr("height", 0)
                    .attr("fill", d => color(d.key))
                    .call(enter => enter.transition().duration(1000)
                        .attr("y", d => y(d.value))
                        .attr("height", d => height - y(d.value))),
                update => update
                    .call(update => update.transition().duration(1000)
                        .attr("y", d => y(d.value))
                        .attr("height", d => height - y(d.value))),
                exit => exit
                    .call(exit => exit.transition().duration(1000)
                        .attr("height", 0)
                        .attr("y", height)
                        .remove())
            )
            .on("mouseover", (event, d) => {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                tooltip.html(`<b>Region:</b> ${d.region}
                        <br><b>Amount of Education Completed:</b> ${legendMapping[d.key]}
                        <br><b>Percent of Population:</b> ${d.value.toFixed(2)}%`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 10}px`);
            })
            .on("mouseout", () => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", (event, d) => {
                if (clickedbar === d.key) {
                    // If bar already highlighted, remove highlight and reset bars
                    svg.selectAll("rect").classed("dim", false);
                    legend.selectAll("rect").classed("dim", false);
                    clickedbar = null;
                } else {
                    // Dim the unclicked bars and legend while keeping selected bar same color
                    svg.selectAll("rect").classed("dim", true);
                    svg.selectAll(`rect[fill='${color(d.key)}']`).classed("dim", false);
                    legend.selectAll("rect").classed("dim", true);
                    legend.select(`rect[fill='${color(d.key)}']`).classed("dim", false);
                    clickedbar = d.key;
                }
            });

        // Add data labels
        barsEnter.merge(bars).selectAll("text")
            .data(d => subgroups.map(key => ({ key, value: +d[key], region: d.Region })))
            .join(
                enter => enter.append("text")
                    .attr("x", d => xsubgroup(d.key) + xsubgroup.bandwidth() / 2)
                    .attr("y", d => y(d.value) - 5)
                    .attr("text-anchor", "middle")
                    .text(d => `${d.value}%`)
                    .style("font-size", "12px")
                    .style("opacity", 0)
                    .call(enter => enter.transition().duration(1000)
                        .style("opacity", 1)),
                update => update
                    .call(update => update.transition().duration(1000)
                        .attr("y", d => y(d.value) - 5)
                        .text(d => `${d.value}%`)),
                exit => exit
                    .call(exit => exit.transition().duration(1000)
                        .style("opacity", 0)
                        .remove())
            );
    };

    // Initially display for 2022
    displayBars(new_data.filter(d => d.Year === "2022"));

    // Event listener for radio button change
    d3.selectAll('input[name="select"]').on('change', function () {
        const selectedYear = this.value;
        displayBars(new_data.filter(d => d.Year === selectedYear));
    });
}

async function scene_45_64() {

    // SVG object
    const svg = d3
        .select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Defining groups and subgroups for side-by-side bar chart x-axis
    const subgroups = ["High_school_grad_or_higher_pct", "Bachelors_or_higher_pct"];
    const groups = ['United States', 'California', 'Pasadena'];
    const legendNames = ["High School Grad or Higher", "Bachelor's Degree or Higher"]

    // Create a mapping from subgroups to legend names
    const legendMapping = {
        "High_school_grad_or_higher_pct": "High School Grad or Higher",
        "Bachelors_or_higher_pct": "Bachelor's Degree or Higher"
    };

    // Color palette
    const color = d3.scaleOrdinal()
        .domain(subgroups)
        .range(['#bf212f', '#264b96']);

    // Tooltip
    const tooltip = d3.select("body")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip");

    // Legend for amount of education completed
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - margin.right + 20}, 0)`);

    legend.selectAll("rect")
        .data(subgroups)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", d => color(d));

    legend.selectAll("text")
        .data(legendNames)
        .enter()
        .append("text")
        .attr("x", 25)
        .attr("y", (d, i) => i * 20 + 15)
        .text(d => d)
        .style("font-size", "12px");

    // Chart title
    svg.append("text")
        .attr("class", "chart_title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text("Educational Attainment for Population 45 to 64 years old");

    // Loading data
    const data = await d3.csv("2021_2022_ACS_Educational_Attainment_data.csv");

    // Filtering for Age_Group = Population 45 to 64 years
    const new_data = data.filter(d => d.Age_Group === "Population 45 to 64 years");

    // X axis and X axis label
    const x = d3.scaleBand()
        .domain(groups)
        .range([0, width])
        .padding([0.2]);

    svg.append("g")
        .attr("class", "x_axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(0));

    svg.append("text")
        .attr("class", "x_axis_label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 30)
        .style("text-anchor", "middle")
        .text("Region");

    // X axis for subgroups
    const xsubgroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, x.bandwidth()])
        .padding([0.05]);

    // Y axis and Y axis label
    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    svg.append("g")
        .attr("class", "y_axis")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("class", "y_axis_label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 30)
        .style("text-anchor", "middle")
        .text("Percentage of Population (in percent)");

    // Variable to keep track of whether a bar is currently selected
    let clickedbar = null;

    // Function to display bars
    var displayBars = (filteredData) => {
        var bars = svg.selectAll("g.bars")
            .data(filteredData, d => d.Region);

        bars.exit().remove();

        var barsEnter = bars.enter().append("g")
            .attr("class", "bars")
            .attr("transform", d => `translate(${x(d.Region)},0)`);

        barsEnter.merge(bars).selectAll("rect")
            .data(d => subgroups.map(key => ({ key, value: +d[key], region: d.Region })))
            .join(
                enter => enter.append("rect")
                    .attr("x", d => xsubgroup(d.key))
                    .attr("y", height)
                    .attr("width", xsubgroup.bandwidth())
                    .attr("height", 0)
                    .attr("fill", d => color(d.key))
                    .call(enter => enter.transition().duration(1000)
                        .attr("y", d => y(d.value))
                        .attr("height", d => height - y(d.value))),
                update => update
                    .call(update => update.transition().duration(1000)
                        .attr("y", d => y(d.value))
                        .attr("height", d => height - y(d.value))),
                exit => exit
                    .call(exit => exit.transition().duration(1000)
                        .attr("height", 0)
                        .attr("y", height)
                        .remove())
            )
            .on("mouseover", (event, d) => {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                tooltip.html(`<b>Region:</b> ${d.region}
                        <br><b>Amount of Education Completed:</b> ${legendMapping[d.key]}
                        <br><b>Percent of Population:</b> ${d.value.toFixed(2)}%`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 10}px`);
            })
            .on("mouseout", () => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", (event, d) => {
                if (clickedbar === d.key) {
                    // If bar already highlighted, remove highlight and reset bars
                    svg.selectAll("rect").classed("dim", false);
                    legend.selectAll("rect").classed("dim", false);
                    clickedbar = null;
                } else {
                    // Dim the unclicked bars and legend while keeping selected bar same color
                    svg.selectAll("rect").classed("dim", true);
                    svg.selectAll(`rect[fill='${color(d.key)}']`).classed("dim", false);
                    legend.selectAll("rect").classed("dim", true);
                    legend.select(`rect[fill='${color(d.key)}']`).classed("dim", false);
                    clickedbar = d.key;
                }
            });

        // Add data labels
        barsEnter.merge(bars).selectAll("text")
            .data(d => subgroups.map(key => ({ key, value: +d[key], region: d.Region })))
            .join(
                enter => enter.append("text")
                    .attr("x", d => xsubgroup(d.key) + xsubgroup.bandwidth() / 2)
                    .attr("y", d => y(d.value) - 5)
                    .attr("text-anchor", "middle")
                    .text(d => `${d.value}%`)
                    .style("font-size", "12px")
                    .style("opacity", 0)
                    .call(enter => enter.transition().duration(1000)
                        .style("opacity", 1)),
                update => update
                    .call(update => update.transition().duration(1000)
                        .attr("y", d => y(d.value) - 5)
                        .text(d => `${d.value}%`)),
                exit => exit
                    .call(exit => exit.transition().duration(1000)
                        .style("opacity", 0)
                        .remove())
            );
    };

    // Initially display for 2022
    displayBars(new_data.filter(d => d.Year === "2022"));

    // Event listener for radio button change
    d3.selectAll('input[name="select"]').on('change', function () {
        const selectedYear = this.value;
        displayBars(new_data.filter(d => d.Year === selectedYear));
    });
}

async function scene_65_Over() {

    // SVG object
    const svg = d3
        .select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Defining groups and subgroups for side-by-side bar chart x-axis
    const subgroups = ["High_school_grad_or_higher_pct", "Bachelors_or_higher_pct"];
    const groups = ['United States', 'California', 'Pasadena'];
    const legendNames = ["High School Grad or Higher", "Bachelor's Degree or Higher"]

    // Create a mapping from subgroups to legend names
    const legendMapping = {
        "High_school_grad_or_higher_pct": "High School Grad or Higher",
        "Bachelors_or_higher_pct": "Bachelor's Degree or Higher"
    };

    // Color palette
    const color = d3.scaleOrdinal()
        .domain(subgroups)
        .range(['#bf212f', '#264b96']);

    // Tooltip
    const tooltip = d3.select("body")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip");

    // Legend for amount of education completed
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - margin.right + 20}, 0)`);

    legend.selectAll("rect")
        .data(subgroups)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", d => color(d));

    legend.selectAll("text")
        .data(legendNames)
        .enter()
        .append("text")
        .attr("x", 25)
        .attr("y", (d, i) => i * 20 + 15)
        .text(d => d)
        .style("font-size", "12px");

    // Chart title
    svg.append("text")
        .attr("class", "chart_title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text("Educational Attainment for Population 65 years old and older");

    // Loading data
    const data = await d3.csv("2021_2022_ACS_Educational_Attainment_data.csv");

    // Filtering for Age_Group = Population 65 years and older
    const new_data = data.filter(d => d.Age_Group === "Population 65 years and over");

    // X axis and X axis label
    const x = d3.scaleBand()
        .domain(groups)
        .range([0, width])
        .padding([0.2]);

    svg.append("g")
        .attr("class", "x_axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(0));

    svg.append("text")
        .attr("class", "x_axis_label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 30)
        .style("text-anchor", "middle")
        .text("Region");

    // X axis for subgroups
    const xsubgroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, x.bandwidth()])
        .padding([0.05]);

    // Y axis and Y axis label
    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    svg.append("g")
        .attr("class", "y_axis")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("class", "y_axis_label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 30)
        .style("text-anchor", "middle")
        .text("Percentage of Population (in percent)");

    // Variable to keep track of whether a bar is currently selected
    let clickedbar = null;

    // Function to display bars
    var displayBars = (filteredData) => {
        var bars = svg.selectAll("g.bars")
            .data(filteredData, d => d.Region);

        bars.exit().remove();

        var barsEnter = bars.enter().append("g")
            .attr("class", "bars")
            .attr("transform", d => `translate(${x(d.Region)},0)`);

        barsEnter.merge(bars).selectAll("rect")
            .data(d => subgroups.map(key => ({ key, value: +d[key], region: d.Region })))
            .join(
                enter => enter.append("rect")
                    .attr("x", d => xsubgroup(d.key))
                    .attr("y", height)
                    .attr("width", xsubgroup.bandwidth())
                    .attr("height", 0)
                    .attr("fill", d => color(d.key))
                    .call(enter => enter.transition().duration(1000)
                        .attr("y", d => y(d.value))
                        .attr("height", d => height - y(d.value))),
                update => update
                    .call(update => update.transition().duration(1000)
                        .attr("y", d => y(d.value))
                        .attr("height", d => height - y(d.value))),
                exit => exit
                    .call(exit => exit.transition().duration(1000)
                        .attr("height", 0)
                        .attr("y", height)
                        .remove())
            )
            .on("mouseover", (event, d) => {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                tooltip.html(`<b>Region:</b> ${d.region}
                        <br><b>Amount of Education Completed:</b> ${legendMapping[d.key]}
                        <br><b>Percent of Population:</b> ${d.value.toFixed(2)}%`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 10}px`);
            })
            .on("mouseout", () => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", (event, d) => {
                if (clickedbar === d.key) {
                    // If bar already highlighted, remove highlight and reset bars
                    svg.selectAll("rect").classed("dim", false);
                    legend.selectAll("rect").classed("dim", false);
                    clickedbar = null;
                } else {
                    // Dim the unclicked bars and legend while keeping selected bar same color
                    svg.selectAll("rect").classed("dim", true);
                    svg.selectAll(`rect[fill='${color(d.key)}']`).classed("dim", false);
                    legend.selectAll("rect").classed("dim", true);
                    legend.select(`rect[fill='${color(d.key)}']`).classed("dim", false);
                    clickedbar = d.key;
                }
            });

        // Add data labels
        barsEnter.merge(bars).selectAll("text")
            .data(d => subgroups.map(key => ({ key, value: +d[key], region: d.Region })))
            .join(
                enter => enter.append("text")
                    .attr("x", d => xsubgroup(d.key) + xsubgroup.bandwidth() / 2)
                    .attr("y", d => y(d.value) - 5)
                    .attr("text-anchor", "middle")
                    .text(d => `${d.value}%`)
                    .style("font-size", "12px")
                    .style("opacity", 0)
                    .call(enter => enter.transition().duration(1000)
                        .style("opacity", 1)),
                update => update
                    .call(update => update.transition().duration(1000)
                        .attr("y", d => y(d.value) - 5)
                        .text(d => `${d.value}%`)),
                exit => exit
                    .call(exit => exit.transition().duration(1000)
                        .style("opacity", 0)
                        .remove())
            );
    };

    // Initially display for 2022
    displayBars(new_data.filter(d => d.Year === "2022"));

    // Event listener for radio button change
    d3.selectAll('input[name="select"]').on('change', function () {
        const selectedYear = this.value;
        displayBars(new_data.filter(d => d.Year === selectedYear));
    });
}