(function() {

var data, svg, minValue, maxValue, legend, legendGradient, legendTicks, 
	map, continuousScale, currentCounty, selectedCounty, states, topFiveData, saipehighlights;
var spark, sparkx, sparky, sparkline;
var sparkLineWidth = 220;
var sparkLineHeight = 150;
var legendGradientWidth = 30;
var legendGradientHeight = 200;
var extraTranslateRight = 100;
var years = [];
var noData = 'rgb(255,255,255)';
var highlightColor = d3.rgb(198, 42, 42);
highlightColor = d3.rgb('red').darker();

var currentYearIndex = 0;
var hue = 230;

function displayCurrentSettings() {
	$('#controls-year .current').text(years[currentYearIndex]);
}

function sortNumberAscending(a, b) {
	return a - b;
}

function getFips(d) {
	return d.properties.GEO_ID.substring(9, 14);
}

function getCountyName(d) {
	var county = d.properties.NAME + ' County';
	var state = states[d.properties.STATE][0];

	return [county, state];
}

function getCountyByFips(fips) {	
	return map.selectAll('path')[0].filter(function(value, index, array) {
		return getFips(value.__data__) == fips;
	})[0];
}

function drawTitleAndMisc() {

	svg.append('svg:text')
		.attr('class', 'year')
		.attr('transform', 'translate(15, 50)')
		.text('');

	svg.append('svg:text')
		.attr('class', 'notes')
		.attr('transform', 'translate(' + (950 + extraTranslateRight) + ', 715)')
		.attr('text-anchor', 'end')
		.text('By: GABRIEL FLORIT | December 2011');

	svg.append('svg:text')
		.attr('class', 'notes')
		.attr('transform', 'translate(' + (950 + extraTranslateRight) + ', 730)')
		.attr('text-anchor', 'end')
		.text('Data: Small Area Income & Poverty Estimates, U.S. Census Bureau');
}

function drawLegend() {

	legend.append('svg:text')
		.attr('class', 'legend-title')
		.attr('x', -25)
		.attr('y', -20)
		.text('percent');

	// create the color gradient
	legendGradient.selectAll('rect')
		.data(d3.range(0, 1, 0.01))
		.enter()
		.insert('svg:rect')
		.attr('x', 1)
		.attr('y', function (d, i) {
			return i * 2;
		})
		.attr('width', legendGradientWidth)
		.attr('height', 2)
		.style('fill', function (d, i) {
			return d3.hsl(hue, 1, d);
		});

	legendTicks.selectAll('text')
		.data([maxValue, minValue])
		.enter()
		.insert('svg:text')
		.attr('class', 'legend-tick')
		.attr('text-anchor', 'end')
		.attr('x', -4)
		.attr('y', function (d, i) {
			return i * legendGradientHeight + 5;
		})
		.text(function(d, i) {
			return d3.format('.0f')(d) + '%';
		});

	// this is a dumb way of creating a border!
	legend.append('svg:rect')
		.attr('y', 0)
		.attr('x', 1)
		.attr('width', legendGradientWidth)
		.attr('height', legendGradientHeight)
		.style('fill', 'none')
		.style('stroke', '#ccc')
		.style('shape-rendering', 'crispEdges');
}

function convertPercentToColor(percent) {

	return percent
		? d3.hsl(hue, 1, 1 - continuousScale(percent))
		: noData;
}

function quantize(d) {

	var fips = getFips(d);

	var datum = data[years[currentYearIndex]][fips];

	return datum ? convertPercentToColor(datum) : noData;
}

function drawMap() {

	svg.select('.year')
		.text(years[currentYearIndex]);

	map.selectAll('path')
		.style('fill', quantize);

	displayCurrentSettings();
}

var path = d3.geo.path();

svg = d3.select('#chart').append('svg:svg');

legend = svg.append('svg:g').attr('transform', 'translate(' + (904 + extraTranslateRight) + ', 240)');
legendGradient = legend.append('svg:g');
legendTicks = legend.append('svg:g');

map = svg.append('svg:g').attr('class', 'map')
	.attr('transform', 'translate(' + (extraTranslateRight + 50) + ', 0)');
spark = svg.append('svg:g').attr('class', 'spark')
	.attr('transform', 'translate(55, 230)')
	.style('visibility', 'hidden');
var countyName = svg.append('svg:g').attr('class', 'countyName')
	.attr('transform', 'translate(15, 260)')
	.style('visibility', 'hidden');
var topFiveInfoSubtitle = svg.append('svg:text')
	.attr('class', 'topFiveInfoSubtitle')
	.attr('transform', 'translate(15, 530)')
	.text('Highest poverty rates:');
var topFive = svg.append('svg:g').attr('class', 'topFive')
	.attr('transform', 'translate(15, 560)');
var topFiveInfo = svg.append('svg:g').attr('class', 'topFiveInfo')
	.attr('transform', 'translate(270, 512)');

d3.json('../static/data/povertyByCounty/states.json', function (json) {

	states = json;
});

d3.json('../static/data/povertyByCounty/saipehighlights.json', function (json) {

	saipehighlights = json;
});

function drawTopFiveInfoText(text) {
	
	topFiveInfo.select("body")
		.html('<p>' + text + '</p>');
}

function drawSpark() {

	if (selectedCounty || currentCounty) {
		
		spark.style('visibility', 'visible');
		countyName.style('visibility', 'visible');

		var fips, name;

		if (selectedCounty) {
			fips = getFips(selectedCounty.__data__);
			name = getCountyName(selectedCounty.__data__);
		}
		else {
			fips = getFips(currentCounty);
			name = getCountyName(currentCounty);
		}

		var sparkdata = [];
		for (var i = 0; i < years.length; i++) {
			var datum = data[years[i]][fips];
			sparkdata.push(datum);
		}

		spark.selectAll("path")
			.data([sparkdata])
			.attr("d", sparkline);

		spark.selectAll('circle')
			.data([sparkdata[currentYearIndex]])
			.attr('cx', function(d, i) {
				return sparkx(currentYearIndex);
			})
			.attr('cy', function(d, i) {
				return sparky(d ? d : minValue);
			});

		spark.selectAll('text')
			.data([sparkdata[0], sparkdata[sparkdata.length - 1], sparkdata[currentYearIndex]])
			.attr('x', function(d, i) {
				return i < 2
					? i * (sparkLineWidth - 22) - 8
					: sparkx(currentYearIndex);
			})
			.attr('y', function(d, i) {
				return i < 2
					? sparky(d ? d : minValue) + 5
					: sparky(d ? d : minValue) - 10;
			})
			.text(function(d, i) {
				return i < 2 
					? d ? d3.format('.1f')(d) : 'n/a'
					: currentYearIndex > 0 && currentYearIndex < years.length - 1
						? d ? d3.format('.1f')(d) : 'n/a'
						: '';
			});

		countyName.selectAll('text')
			.data(name)
			.text(function(d, i) {
				return d;
			});
	}
	else {
		spark.style('visibility', 'hidden');
		countyName.style('visibility', 'hidden');
	}
}

function setTopFive() {

	var allData = [];
	for (var i = 0; i < years.length; i++) {
		allData.push(d3.entries(data[years[i]]))
	}

	topFiveData = d3.nest()
		.key(function(d) {
			return d.key;
		})
		.entries(d3.merge(allData))
		.map(function(value) {

			// this is a bit crazy! what value is what??!! nonsense! clean it up!!!
			var allValues = value.values.map(function(value) {
				return value.value;
			});

			var max = d3.max(allValues);

			var result = {};
			result['key'] = value.key;
			result['value'] = max;

			return result;
		})
		.sort(function(a, b) {
			return b.value - a.value;
		})
		.slice(0, 6);
}

d3.json('../static/geojson/povertyByCounty/counties.json', function (json) {

	var features = [];

	// ignore puerto rico
	for (var i = 0; i < json.features.length; i++) {
		var feature = json.features[i];
		if (feature.properties && feature.properties.STATE && feature.properties.STATE <= 56) {
			features.push(feature);
		}
	}

	svg.on('click', function(d, i) {

		// is a county selected?
		if (selectedCounty) {

			// deselect it
			d3.select(selectedCounty)
				.style('fill', convertPercentToColor(data[years[currentYearIndex]][getFips(selectedCounty.__data__)]));

			selectedCounty = null;
			drawSpark();
			drawTopFiveInfoText('');
		}
	});

	map.selectAll('path')
		.data(features)
		.enter()
		.append('svg:path')
		.attr('d', path)
		.style('fill', noData)
		.on('mouseover', function (d) {

			if (selectedCounty) {
				
			}
			else {
				d3.select(this)
					.style('fill', highlightColor);

				currentCounty = d;
				drawSpark();
			}
		})
		.on('mouseout', function (d) {

			if (selectedCounty) {
				
			}
			else {
				d3.select(this)
					.style('fill', convertPercentToColor(data[years[currentYearIndex]][getFips(d)]));
			}

			currentCounty = null;
			drawSpark();
		})
		.on('click', function(d, i) {

			var fips = getFips(d);

			// is this one of the top five counties? if so, show the text
			var topFiveCounties = topFiveData.filter(function(value, index, array) {
				return value.key == fips;
			});

			if (topFiveCounties.length > 0) {
				drawTopFiveInfoText(saipehighlights[topFiveCounties[0].key]);
			}
			else {
				drawTopFiveInfoText('');
			}

			// is a county selected?
			if (selectedCounty) {

				// there can be two cases:
				// 1 - we've clicked on the currently selected county
				// 2 - we've clicked on a new county

				// 1 - if we've clicked on the currently selected county,				
				// deselect it
				if (selectedCounty == this) {
					
					// deselect it
					d3.select(selectedCounty)
						.style('fill', convertPercentToColor(data[years[currentYearIndex]][getFips(selectedCounty.__data__)]));

					selectedCounty = null;
	
					drawTopFiveInfoText('');
				}

				// 2 - if we've clicked on a new county,
				// deselect the selected county and then select this one
				else {
					
					// deselect it
					d3.select(selectedCounty)
						.style('fill', convertPercentToColor(data[years[currentYearIndex]][getFips(selectedCounty.__data__)]));

					selectedCounty = this;

					d3.select(selectedCounty)
						.style('fill', highlightColor);
					
					drawSpark();
				}
			}
			// no county is selected - select this one
			else {
				selectedCounty = this;

				d3.select(selectedCounty)
					.style('fill', highlightColor);
			}

			d3.event.stopPropagation();
		});

	d3.json('../static/data/povertyByCounty/saipe.json', function (saipe) {

		for (var year in saipe) {
			years.push(parseInt(year));
		}

		years = years.sort(sortNumberAscending);

		data = saipe;

		// get the top 5
		setTopFive();

		// get max and min
		var allYears = [];
		for (var i = 0; i < years.length; i++) {
			var yearValues = data[years[i]];
			allYears.push(d3.values(yearValues));
		}

		var sortedValues = d3.merge(allYears)
			.sort(sortNumberAscending);

		minValue = d3.min(sortedValues);
		maxValue = d3.max(sortedValues);

		continuousScale = d3.scale.linear().domain([minValue, maxValue]).range([0, 1]);
		sparkx = d3.scale.linear().domain([0, years.length]).range([0, sparkLineWidth]);
		sparky = d3.scale.linear().domain([minValue, maxValue]).range([0, -sparkLineHeight]);

		sparkline = d3.svg.line()
			.x(function(d,i) { 
				return sparkx(i); 
			})
			.y(function(d) { 
				return sparky(d ? d : minValue);
			});

		var tempCounty = getCountyByFips(topFiveData[0].key).__data__;
		var fips = getFips(tempCounty);
		var name = getCountyName(tempCounty);

		var sparkdata = [];
		for (var i = 0; i < years.length; i++) {
			var datum = data[years[i]][fips];
			sparkdata.push(datum);
		}

		topFiveInfo.append("foreignObject")
			.attr("width", 770)
			.attr("height", 500)
			.append("xhtml:body")
			.html("")
			.on('click', function(d) {

				d3.event.stopPropagation();
			});

		topFive.selectAll('text')
			.data(topFiveData)
			.enter()
			.append('svg:image')
			.attr('xlink:href', '../static/img/povertyByCounty/play_9x12.png')
			.attr('width', 9)
			.attr('height', 12)
			.attr('x', 0)
			.attr('y', function(d, i) {
				return i * 25 - 11;
			});

		topFive.selectAll('text')
			.data(topFiveData)
			.enter()
			.insert('svg:text')
			.attr('x', 15)
			.attr('y', function(d, i) {
				return i * 25;
			})
			.text(function(d, i) {

				var county = getCountyByFips(d.key);
				return county.__data__.properties.NAME + ', ' + states[county.__data__.properties.STATE][1]
					+ ': ' + d3.format('.1f')(d.value) + '%';
			})
			.on('mouseover', function (d) {

				var county = getCountyByFips(d.key);

				// if this county is also selected, do nothing
				if (county == selectedCounty) {
					
				}
				else {
					d3.select(county)
						.style('fill', highlightColor);
					currentCounty = county.__data__;
					drawSpark();
				}
			})
			.on('mouseout', function (d) {

				var county = getCountyByFips(d.key);

				// if this county is also selected, do nothing
				if (county == selectedCounty) {
					
				}
				else {
					d3.select(county)
						.style('fill', convertPercentToColor(d.value));
					currentCounty = null;
					drawSpark();
				}
			})
			.on('click', function(d, i) {

				currentCounty = null;

				var county = getCountyByFips(d.key);

				// if this county is also selected, do nothing
				if (county == selectedCounty) {
					
				}
				else {

					if (selectedCounty) {
						d3.select(selectedCounty)
							.style('fill', convertPercentToColor(data[years[currentYearIndex]][getFips(selectedCounty.__data__)]));
					}

					selectedCounty = county;
					drawSpark();

					drawTopFiveInfoText(saipehighlights[d.key]);
				}

				d3.event.stopPropagation();
			});

		spark.append("svg:path").attr("d", sparkline(sparkdata));
		spark.selectAll('text')
			.data([sparkdata[0], sparkdata[sparkdata.length - 1], sparkdata[currentYearIndex]])
			.enter()
			.insert('svg:text')
			.attr('text-anchor', function(d, i) {
				switch(i) {
					case 0:
						return 'end';
					break;

					case 1:
						return 'start';
					break;

					case 2:
						return 'middle';
					break;
				}
			})
			.attr('x', function(d, i) {
				return i < 2
					? i * (sparkLineWidth - 22) - 8
					: sparkx(currentYearIndex);
			})
			.attr('y', function(d, i) {
				return i < 2
					? sparky(d) + 5
					: sparky(d) - 10;
			})
			.text(function(d, i) {
				return i < 2 
					? d3.format('.1f')(d)
					: currentYearIndex > 0 && currentYearIndex < years.length - 1
						? d3.format('.1f')(d)
						: '';
			});
		
		spark.selectAll('circle')
			.data([sparkdata[currentYearIndex]])
			.enter()
			.insert('svg:circle')
			.attr('cx', function(d, i) {
				return sparkx(currentYearIndex);
			})
			.attr('cy', function(d, i) {
				return sparky(d);
			})
			.attr('r', 5);

		countyName.selectAll('text')
			.data(name)
			.enter()
			.insert('svg:text')
			.attr('class', function(d, i) {
				return i == 0 ? 'county' : 'state';
			})
			.attr('y', function(d, i) {
				return i * 25;
			})			
			.text(function(d, i) {
				return d;
			});

		drawTitleAndMisc();

		setTimeout(function() {
			drawMapAndLegend();

			$('#controls').show();
			$('#about').show();
			$('#loading').hide();

		}, 500);
	});
});

function eraseLegend() {
	legend.selectAll('text').remove();
	legendGradient.selectAll('rect').remove();
	legendTicks.selectAll('text').remove();
}

function drawMapAndLegend() {
	eraseLegend();
	drawLegend();
	drawMap();
}

function yearLeft() {
	currentYearIndex--;
	if (currentYearIndex < 0) {
		currentYearIndex = years.length - 1;
	}
	drawMap();
	drawSpark();

	if (selectedCounty) {
		d3.select(selectedCounty)
		.style('fill', highlightColor);
	}
}

function yearRight() {
	currentYearIndex++;
	if (currentYearIndex > years.length - 1) {
		currentYearIndex = 0;
	}
	drawMap();
	drawSpark();

	if (selectedCounty) {
		d3.select(selectedCounty)
		.style('fill', highlightColor);
	}
}

d3.select(window).on("keydown", function () {
	switch (d3.event.keyCode) {

		// left
		case 37:
			yearLeft();
			break;

		// right
		case 39:
			yearRight();
			break;
	}
});

$('#year-left').click(function() {
	yearLeft();
});

$('#year-right').click(function() {
	yearRight();
});

})()