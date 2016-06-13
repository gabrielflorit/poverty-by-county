(function() {

var data, svg, minValue, maxValue, legend, legendGradient, legendTicks, map, chosenBreaks, continuousScale;
var legendGradientWidth = 30;
var legendGradientHeight = 200;
var years = [];
var allValues = [];
var noData = 'rgb(255,255,255)';
var classifications = ['interval', 'quantile', 'k-means', 'continuous'];

// initialize map from query string, if possible
var classificationIndex = $.urlParam('class', 3);
var breaks = parseInt($.urlParam('breaks', 4));
var currentYearIndex = $.urlParam('year', 0);
var hue = $.urlParam('hue', 230);

function createBreaks() {

	chosenBreaks = [];

	switch (classifications[classificationIndex])
	{
		case 'interval':
			var equalIntervalsScale = d3.scale.linear()
				.domain([0, breaks])
				.range([minValue, maxValue]);

			for (var i = 0; i <= breaks; i++) {
				chosenBreaks.push(equalIntervalsScale(i));
			}
		break;

		case 'quantile':
			var quantiles = d3.scale.quantile()
				.domain(allValues)
				.range(d3.range(breaks))
				.quantiles();
			
			chosenBreaks.push(minValue);

			for (var i = 0; i < quantiles.length; i++) {
				chosenBreaks.push(quantiles[i]);
			}

			chosenBreaks.push(maxValue);
		break;

		case 'k-means':
			var kData = d3.zip(allValues);
			var kScale = science.stats.kmeans().k(breaks)(kData);

			var kClusters = {};
			for (var i = 0; i < breaks; i++) {
				kClusters[i] = [];
			}

			for (var i = 0; i < allValues.length; i++) {
				var assignment = kScale.assignments[i];
				kClusters[assignment].push(allValues[i]);
			}

			var tempKMeansBreaks = [];

			for (var i = 0; i < breaks; i++) {
				tempKMeansBreaks.push(kClusters[i][0]);
				tempKMeansBreaks.push(kClusters[i][kClusters[i].length - 1]);
			}

			tempKMeansBreaks = tempKMeansBreaks.sort(sortNumber);

			chosenBreaks.push(tempKMeansBreaks[0]);
			for (var i = 1; i < tempKMeansBreaks.length; i = i + 2) {
				chosenBreaks.push(tempKMeansBreaks[i]);
			}
		break;

		default:
		break;
	}
}

function displayCurrentSettings() {

	$('#controls-classification .current').text(classifications[classificationIndex]);
	$('#controls-year .current').text(years[currentYearIndex]);

	if (classifications[classificationIndex] == 'continuous') {
		$('#controls-breaks').parent().parent().hide();
	} else {
		$('#controls-breaks').parent().parent().show();
		$('#controls-breaks .current').text(breaks);
	}

	$('#controls-hue .current').text(hue);
}

function sortNumber(a, b) {
	return a - b;
}

function getFips(d) {
	return d.properties.GEO_ID.substring(9, 14);
}

function drawTitleAndMisc() {

	svg.append('svg:text')
		.attr('class', 'title')
		.attr('transform', 'translate(515, 25)')
		.text('Poverty estimates by county, ' + years[0] + '-' + years[years.length - 1]);

	svg.append('svg:text')
		.attr('class', 'year')
		.attr('transform', 'translate(15, 50)')
		.text('');

	svg.append('svg:text')
		.attr('class', 'notes')
		.attr('transform', 'translate(950, 475)')
		.attr('text-anchor', 'end')
		.text('By: GABRIEL FLORIT');

	svg.append('svg:text')
		.attr('class', 'notes')
		.attr('transform', 'translate(950, 490)')
		.attr('text-anchor', 'end')
		.text('Source: Small Area Income & Poverty Estimates, U.S. Census Bureau');
}

function drawLegend() {

	switch (classifications[classificationIndex])
	{
		case 'interval':
		case 'continuous':
		case 'k-means':
			legend.append('svg:text')
				.attr('class', 'legend-title')
				.attr('x', -25)
				.attr('y', -20)
				.text('percent');
		break;

		case 'quantile':
			legend.append('svg:text')
				.attr('class', 'legend-title')
				.attr('x', -28)
				.attr('y', -20)
				.text('quantile');
		break;

		default:
		break;
	}

	var heightByBreaks = legendGradientHeight/breaks;

	// create the color gradient
	switch (classifications[classificationIndex])
	{
		case 'interval':
		case 'quantile':
		case 'k-means':
			legendGradient.selectAll('rect')
				.data(d3.range(0, breaks, 1))
				.enter()
				.insert('svg:rect')
				.attr('x', 1)
				.attr('y', function (d, i) {
					return i * heightByBreaks;
				})
				.attr('width', legendGradientWidth)
				.attr('height', heightByBreaks)
				.style('fill', function (d, i) {
					return d3.hsl(hue, 1, i/breaks);
				});
			break;

		case 'continuous':
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
			break;

		default:
		break;
	}

	// add the ticks
	switch (classifications[classificationIndex])
	{
		case 'interval':
			legendTicks.selectAll('text')
				.data(d3.range(breaks, -1, -1))
				.enter()
				.insert('svg:text')
				.attr('class', 'legend-tick')
				.attr('text-anchor', 'end')
				.attr('x', -4)
				.attr('y', function (d, i) {
					return i * heightByBreaks + 5;
				})
				.text(function(d, i) {
					return d3.format('.0f')(chosenBreaks[d]) + '%';
				});
		break;

		case 'quantile':
			legendTicks.selectAll('text')
				.data(d3.range(breaks, 0, -1))
				.enter()
				.insert('svg:text')
				.attr('class', 'legend-tick')
				.attr('text-anchor', 'end')
				.attr('x', -4)
				.attr('y', function (d, i) {
					return i * heightByBreaks + 5 + (legendGradientHeight/(breaks*2));
				})
				.text(String);
		break;

		case 'continuous':
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
			break;

		case 'k-means':
			legendTicks.selectAll('text')
				.data(d3.range(breaks, -1, -1))
				.enter()
				.insert('svg:text')
				.attr('class', 'legend-tick')
				.attr('text-anchor', 'end')
				.attr('x', -4)
				.attr('y', function (d, i) {
					return i * heightByBreaks + 5;
				})
				.text(function(d, i) {
					return d3.format('.0f')(chosenBreaks[d]) + '%';
				});
		break;

		default:
		break;
	}

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

	var color = null;

	for (var i = 1; i <= breaks; i++) {

		switch (classifications[classificationIndex])
		{
			case 'interval':
				if (percent <= chosenBreaks[i]) {
					color = d3.hsl(hue, 1, (1 - i/breaks));
				}
			break;

			case 'quantile':
				if (i < breaks) {
					if (percent < chosenBreaks[i]) {
						color = d3.hsl(hue, 1, (1 - i/breaks));
					}
				}
				else {
					// shortcircuit - if we're here the data point will always be in the last break
					color = d3.hsl(hue, 1, (1 - i/breaks));
				}
			break;

			case 'continuous':
				color = d3.hsl(hue, 1, 1 - continuousScale(percent));
			break;

			case 'k-means':
				if (percent <= chosenBreaks[i]) {
					color = d3.hsl(hue, 1, (1 - i/breaks));
				}
			break;

			default:
			break;
		}

		if (color) {
			return color;
		}
	}
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

legend = svg.append('svg:g').attr('transform', 'translate(904, 240)');
legendGradient = legend.append('svg:g');
legendTicks = legend.append('svg:g');

map = svg.append('svg:g').attr('class', 'map')
	.attr('transform', 'translate(50, 0)');

d3.json('static/geojson/povertyByCounty/counties.json', function (json) {

	var features = [];

	// ignore puerto rico
	for (var i = 0; i < json.features.length; i++) {
		var feature = json.features[i];
		if (feature.properties && feature.properties.STATE && feature.properties.STATE <= 56) {
			features.push(feature);
		}
	}

	map.selectAll('path')
		.data(features)
		.enter()
		.append('svg:path')
		.attr('d', path)
		.style('fill', noData);

	d3.json('static/data/povertyByCounty/saipe.json', function (saipe) {

		for (var year in saipe) {
			years.push(parseInt(year));
		}

		data = saipe;

		// get max and min
		for (var i = 0; i < years.length; i++) {
			var year = data[years[i]];
			for (var datum in year) {
				allValues.push(year[datum]);
			}
		}

		allValues = allValues.sort(sortNumber);

		minValue = d3.min(allValues);
		maxValue = d3.max(allValues);

		continuousScale = d3.scale.linear().domain([minValue, maxValue]).range([0, 1]);

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
	createBreaks();
	eraseLegend();
	drawLegend();
	drawMap();
}

function classificationLeft() {
	classificationIndex--;
	if (classificationIndex < 0) {
		classificationIndex = classifications.length - 1;
	}
	drawMapAndLegend();
}

function classificationRight() {
	classificationIndex++;
	if (classificationIndex > classifications.length - 1) {
		classificationIndex = 0;
	}
	drawMapAndLegend();
}

function yearLeft() {
	currentYearIndex--;
	if (currentYearIndex < 0) {
		currentYearIndex = years.length - 1;
	}
	drawMap();
}

function yearRight() {
	currentYearIndex++;
	if (currentYearIndex > years.length - 1) {
		currentYearIndex = 0;
	}
	drawMap();
}

function breaksLeft() {
	if (breaks > 2) {
		breaks--;
		drawMapAndLegend();
	}
}

function breaksRight() {
	breaks++;
	drawMapAndLegend();
}

function hueLeft() {
	hue--;
	if (hue < 0) {
		hue = 360;
	}
	drawMapAndLegend();
}

function hueRight() {
	hue++;
	if (hue > 360) {
		hue = 0;
	}
	drawMapAndLegend();
}

d3.select(window).on("keydown", function () {
	switch (d3.event.keyCode) {

		// c
		case 67:
			classificationLeft();
			break;

		// v
		case 86:
			classificationRight();
			break;

		// up
		case 38:
			breaksRight();
			break;

		// down
		case 40:
			breaksLeft();
			break;

		// h
		case 72:
			hueLeft();
			break;

		// j
		case 74:
			hueRight();
			break;

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

$('#classification-left').click(function() {
	classificationLeft();
});

$('#classification-right').click(function() {
	classificationRight();
});

$('#year-left').click(function() {
	yearLeft();
});

$('#year-right').click(function() {
	yearRight();
});

$('#breaks-left').click(function() {
	breaksLeft();
});

$('#breaks-right').click(function() {
	breaksRight();
});

$('#hue-left').click(function() {
	hueLeft();
});

$('#hue-right').click(function() {
	hueRight();
});

})()